import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { createDefaultTelegramDbState } from "../telegram-db";

const connectionString = process.env.DATABASE_URL?.trim();

if (process.env.NODE_ENV === "production" && !connectionString) {
  throw new Error("DATABASE_URL must be configured in production; PostgreSQL is the application persistence store.");
}

export const postgresPool = connectionString
  ? new Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX || 8),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      statement_timeout: 30_000,
      ...(process.env.PGSSL === "true" ? { ssl: { rejectUnauthorized: false } } : {}),
    })
  : null;

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: readonly unknown[],
): Promise<QueryResult<T>> {
  if (!postgresPool) {
    return Promise.reject(new Error("DATABASE_URL is not configured."));
  }
  return postgresPool.query<T>(text, values as unknown[] | undefined);
}

export async function withTransaction<T>(run: (client: PoolClient) => Promise<T>): Promise<T> {
  if (!postgresPool) throw new Error("DATABASE_URL is not configured.");
  const client = await postgresPool.connect();
  try {
    await client.query("BEGIN");
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

let initialization: Promise<void> | null = null;

const persistentArrayKeys = [
  "accounts", "sources", "messages", "media", "questions", "tips", "notices", "pearls",
  "crossChecks", "heartbeats", "jobs", "savedItems", "canonicalItems", "telegram_messages",
  "media_assets", "canonical_questions", "exam_tips", "processing_jobs", "telegram_channels",
  "telegram_user_sessions",
];

function entityKey(namespace: string, item: Record<string, unknown>, index: number): string {
  if (typeof item.id === "string" && item.id) return `id:${item.id}`;
  if (namespace === "cloud-db" && item.sourceId && item.telegramMessageId) {
    return `message:${item.accountId || "primary"}:${item.sourceId}:${item.telegramMessageId}`;
  }
  if (namespace === "legacy-pipeline" && item.compositeKey) return `message:${item.compositeKey}`;
  if (item.contentFingerprint) return `fingerprint:${item.contentFingerprint}`;
  if (item.normalizedHash) return `hash:${item.normalizedHash}`;
  if (item.itemId) return `item:${item.itemId}`;
  return `row:${index}:${JSON.stringify(item)}`;
}

function countStateRecords(state: Record<string, unknown>): number {
  return Object.values(state).reduce<number>((count, value) => count + (Array.isArray(value) ? value.length : 0), 0);
}

async function migrateJsonState(
  namespace: string,
  relativePath: string,
  defaultState: Record<string, unknown>,
): Promise<void> {
  if (!postgresPool) return;
  const sourceId = process.env.PERSISTENCE_MIGRATION_SOURCE?.trim() || process.env.RENDER_SERVICE_NAME?.trim() || "local";
  const sourceKey = `${sourceId}:${relativePath}`;
  const prior = await postgresPool.query("SELECT 1 FROM persistence_migration_sources WHERE source_key = $1", [sourceKey]);
  if (prior.rowCount) return;

  let localState = JSON.parse(JSON.stringify(defaultState)) as Record<string, unknown>;
  let sourceExists = false;
  try {
    const parsed = JSON.parse(await readFile(path.join(process.cwd(), relativePath), "utf8")) as Record<string, unknown>;
    localState = { ...localState, ...parsed };
    sourceExists = true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw new Error(`Legacy data ${relativePath} could not be read safely: ${(error as Error).message}`);
    }
  }

  await withTransaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`persistence-migration:${namespace}`]);
    const marker = await client.query("SELECT 1 FROM persistence_migration_sources WHERE source_key = $1 FOR UPDATE", [sourceKey]);
    if (marker.rowCount) return;
    const currentResult = await client.query<{ state: Record<string, unknown> }>(
      "SELECT state FROM telegram_legacy_state WHERE namespace = $1 FOR UPDATE",
      [namespace],
    );
    if (!sourceExists && !currentResult.rows[0] && process.env.NODE_ENV === "production" && process.env.PERSISTENCE_ALLOW_EMPTY !== "true") {
      throw new Error(`Legacy file ${relativePath} is absent and PostgreSQL has no ${namespace} data. Export the current service state or explicitly confirm an empty migration with PERSISTENCE_ALLOW_EMPTY=true.`);
    }

    const currentState = currentResult.rows[0]?.state;
    let state = currentState ? { ...localState, ...currentState } : localState;
    let migrated = sourceExists ? countStateRecords(localState) : 0;
    let deduplicated = 0;
    if (currentState) {
      state = { ...currentState };
      for (const key of persistentArrayKeys) {
        const localItems = Array.isArray(localState[key]) ? localState[key] as Record<string, unknown>[] : [];
        const currentItems = Array.isArray(currentState[key]) ? currentState[key] as Record<string, unknown>[] : [];
        const seen = new Set(currentItems.map((item, index) => entityKey(namespace, item, index)));
        const additions: Record<string, unknown>[] = [];
        for (const [index, item] of localItems.entries()) {
          const identity = entityKey(namespace, item, index);
          if (seen.has(identity)) deduplicated++;
          else {
            seen.add(identity);
            additions.push(item);
          }
        }
        state[key] = [...additions, ...currentItems];
        migrated = Math.max(0, migrated - additions.length);
      }
      // Prefer current state metadata once any service has initialized the namespace.
      migrated = persistentArrayKeys.reduce((total, key) => {
        const localItems = Array.isArray(localState[key]) ? (localState[key] as unknown[]).length : 0;
        const currentItems = Array.isArray(currentState[key]) ? (currentState[key] as unknown[]).length : 0;
        const mergedItems = Array.isArray(state[key]) ? (state[key] as unknown[]).length : 0;
        return total + Math.max(0, mergedItems - currentItems);
      }, 0);
    }

    await client.query(
      `INSERT INTO telegram_legacy_state(namespace, state) VALUES ($1, $2::jsonb)
       ON CONFLICT (namespace) DO UPDATE SET state = EXCLUDED.state,
         revision = telegram_legacy_state.revision + 1, updated_at = NOW()`,
      [namespace, JSON.stringify(state)],
    );
    const discovered = sourceExists ? countStateRecords(localState) : 0;
    await client.query(
      `INSERT INTO persistence_migration_log(source_key, records_discovered, records_migrated, records_deduplicated)
       VALUES ($1, $2, $3, $4) ON CONFLICT (source_key) DO NOTHING`,
      [sourceKey, discovered, migrated, deduplicated],
    );
    await client.query("INSERT INTO persistence_migration_sources(source_key) VALUES ($1) ON CONFLICT DO NOTHING", [sourceKey]);
    console.info(`[Postgres Migration] ${sourceKey}: discovered=${discovered}, migrated=${migrated}, deduplicated=${deduplicated}, skipped=0, failed=0`);
  });
}

export function initializePostgres(): Promise<void> {
  if (!postgresPool) {
    if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL is required.");
    return Promise.resolve();
  }
  if (!initialization) {
    initialization = (async () => {
      const schemaPath = path.join(process.cwd(), "server", "db", "schema.sql");
      const schema = await readFile(schemaPath, "utf8");
      await postgresPool.query(schema);
      await postgresPool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await postgresPool.query(
        "INSERT INTO schema_migrations(version) VALUES ($1) ON CONFLICT (version) DO NOTHING",
        ["001_initial_schema"],
      );
      const defaultCloudState: Record<string, unknown> = {
        accounts: [], sources: [], messages: [], media: [], questions: [], tips: [], notices: [],
        pearls: [], crossChecks: [], heartbeats: [], jobs: [], savedItems: [], canonicalItems: [],
      };
      await migrateJsonState("cloud-db", "server/data/cloud_telegram_db.json", defaultCloudState);
      await migrateJsonState(
        "legacy-pipeline",
        "data/telegram-knowledge-bank.json",
        createDefaultTelegramDbState() as unknown as Record<string, unknown>,
      );
      const legacyGeminiKeyPath = path.join(process.cwd(), "server", "data", "gemini_key.json");
      try {
        const parsed = JSON.parse(await readFile(legacyGeminiKeyPath, "utf8")) as { apiKey?: unknown };
        if (typeof parsed.apiKey === "string" && parsed.apiKey.trim()) {
          const keyMigration = await postgresPool.query(
            `INSERT INTO runtime_secrets(name, value) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
            ["GEMINI_API_KEY", parsed.apiKey.trim()],
          );
          await postgresPool.query(
            `INSERT INTO persistence_migration_log(source_key, records_discovered, records_migrated, records_skipped)
             VALUES ($1, 1, $2, $3) ON CONFLICT (source_key) DO NOTHING`,
            ["server/data/gemini_key.json", keyMigration.rowCount ? 1 : 0, keyMigration.rowCount ? 0 : 1],
          );
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          console.warn("[Postgres Migration] Legacy Gemini key file could not be imported; value was not logged.");
          await postgresPool.query(
            `INSERT INTO persistence_migration_log(source_key, records_discovered, records_failed)
             VALUES ($1, 1, 1) ON CONFLICT (source_key) DO NOTHING`,
            ["server/data/gemini_key.json"],
          );
        }
      }
      if (!process.env.GEMINI_API_KEY) {
        const storedKey = await postgresPool.query<{ value: string }>(
          "SELECT value FROM runtime_secrets WHERE name = $1",
          ["GEMINI_API_KEY"],
        );
        if (storedKey.rows[0]?.value) process.env.GEMINI_API_KEY = storedKey.rows[0].value;
      }
      await postgresPool.query("SELECT 1");
    })().catch((error) => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
}

export async function closePostgres(): Promise<void> {
  if (postgresPool) await postgresPool.end();
}
