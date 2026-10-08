import { postgresPool, query, withTransaction } from "./client";
import {
  CloudDatabaseSchema,
  CloudDb,
  getCloudDatabase,
  invokeCloudDbMethodWithState,
  replaceCloudDatabaseForDevelopment,
} from "./postgres";

type StateRecord = { state: CloudDatabaseSchema };

async function readState(): Promise<CloudDatabaseSchema> {
  const result = await query<StateRecord>(
    "SELECT state FROM telegram_legacy_state WHERE namespace = $1",
    ["cloud-db"],
  );
  if (!result.rows[0]) throw new Error("Telegram PostgreSQL state has not been initialized.");
  return result.rows[0].state;
}

const mutatingMethods = new Set([
  "saveAccount", "upsertAccount", "deleteAccount", "upsertSources", "saveSources", "insertSource",
  "setSourceMonitored", "updateSourceCursor", "updateSourceCheckpoint", "toggleSourceMonitored",
  "insertMessage", "insertRawMessage", "updateMessageStatus", "insertMedia", "insertQuestion",
  "insertPearl", "insertTip", "insertNotice", "insertCrossCheck", "createJob", "updateJob",
  "recordHeartbeat", "toggleSavedItem", "updateSavedItemNotes", "deleteSavedItem", "upsertCanonicalItem",
  "resetTelegramNamespace",
]);

async function invoke(method: string, args: unknown[]): Promise<unknown> {
  // Preserve the existing local-only developer/test workflow when no database
  // is configured. Production refuses to start without DATABASE_URL.
  if (!postgresPool) {
    if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL is required for PostgreSQL persistence.");
    if (method === "getDatabase") return getCloudDatabase();
    if (method === "mergeEnrichment") {
      const state = getCloudDatabase();
      const update = args[0] as Pick<CloudDatabaseSchema, "questions" | "pearls" | "crossChecks">;
      const mergeById = <T extends { id: string }>(current: T[], changed: T[]) => {
        const items = new Map(current.map((item) => [item.id, item]));
        for (const item of changed) items.set(item.id, item);
        return Array.from(items.values());
      };
      state.questions = mergeById(state.questions || [], update.questions || []);
      state.pearls = mergeById(state.pearls || [], update.pearls || []);
      state.crossChecks = mergeById(state.crossChecks || [], update.crossChecks || []);
      replaceCloudDatabaseForDevelopment(state);
      return;
    }
    const localMethod = (CloudDb as unknown as Record<string, (...input: unknown[]) => unknown>)[method];
    if (typeof localMethod !== "function") throw new Error(`Unknown Telegram database operation: ${method}`);
    return localMethod.apply(CloudDb, args);
  }
  if (method === "getDatabase") return readState();
  if (method === "mergeEnrichment") {
    const update = args[0] as Pick<CloudDatabaseSchema, "questions" | "pearls" | "crossChecks">;
    return withTransaction(async (client) => {
      const selected = await client.query<StateRecord>(
        "SELECT state FROM telegram_legacy_state WHERE namespace = $1 FOR UPDATE",
        ["cloud-db"],
      );
      if (!selected.rows[0]) throw new Error("Telegram PostgreSQL state has not been initialized.");
      const state = selected.rows[0].state;
      const mergeById = <T extends { id: string }>(current: T[], changed: T[]) => {
        const items = new Map(current.map((item) => [item.id, item]));
        for (const item of changed) items.set(item.id, item);
        return Array.from(items.values());
      };
      state.questions = mergeById(state.questions || [], update.questions || []);
      state.pearls = mergeById(state.pearls || [], update.pearls || []);
      state.crossChecks = mergeById(state.crossChecks || [], update.crossChecks || []);
      await client.query(
        "UPDATE telegram_legacy_state SET state = $1::jsonb, revision = revision + 1, updated_at = NOW() WHERE namespace = $2",
        [JSON.stringify(state), "cloud-db"],
      );
    });
  }
  if (mutatingMethods.has(method)) {
    return withTransaction(async (client) => {
      const selected = await client.query<StateRecord>(
        "SELECT state FROM telegram_legacy_state WHERE namespace = $1 FOR UPDATE",
        ["cloud-db"],
      );
      if (!selected.rows[0]) throw new Error("Telegram PostgreSQL state has not been initialized.");
      const changed = invokeCloudDbMethodWithState(method, args, selected.rows[0].state);
      await client.query(
        `UPDATE telegram_legacy_state SET state = $1::jsonb, revision = revision + 1, updated_at = NOW()
         WHERE namespace = $2`,
        [JSON.stringify(changed.state), "cloud-db"],
      );
      return changed.result;
    });
  }

  const state = await readState();
  return invokeCloudDbMethodWithState(method, args, state).result;
}

/** Async production counterpart to CloudDb, with PostgreSQL as the shared store. */
export const PgCloudDb = new Proxy({} as Record<string, (...args: unknown[]) => Promise<any>>, {
  get: (_target, property) => {
    if (typeof property !== "string") return undefined;
    return (...args: unknown[]) => invoke(property, args);
  },
});
