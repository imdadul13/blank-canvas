import { postgresPool, query, withTransaction } from "./client";
import {
  TelegramDbSchema,
  getTelegramDb,
  invokeTelegramDbMethodWithState,
  replaceTelegramDbForDevelopment,
} from "../telegram-db";

type StateRow = { state: TelegramDbSchema };

async function readState(): Promise<TelegramDbSchema> {
  const result = await query<StateRow>(
    "SELECT state FROM telegram_legacy_state WHERE namespace = $1",
    ["legacy-pipeline"],
  );
  if (!result.rows[0]) throw new Error("Telegram pipeline PostgreSQL state has not been initialized.");
  return result.rows[0].state;
}

const mutating = new Set([
  "insertRawTelegramMessage", "updateRawMessageStatus", "insertMediaAsset", "insertOrUpdateQuestion",
  "insertExamTip", "insertNotice", "createOrUpdateJob", "updateChannelCursor", "addChannelToDb",
  "deleteChannelFromDb", "saveUserAccountSession",
]);

async function invoke(method: string, args: unknown[]): Promise<unknown> {
  if (!postgresPool) {
    if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL is required for Telegram persistence.");
    if (method === "getDatabase") return getTelegramDb();
    if (method === "saveDatabase") return;
    if (method === "updateState") {
      const state = getTelegramDb();
      const mutator = args[0] as (draft: TelegramDbSchema) => unknown;
      const result = mutator(state);
      replaceTelegramDbForDevelopment(state);
      return result;
    }
    const changed = invokeTelegramDbMethodWithState(method, args, getTelegramDb());
    if (mutating.has(method)) replaceTelegramDbForDevelopment(changed.state);
    return changed.result;
  }

  if (method === "getDatabase") return readState();
  if (method === "updateState") {
    return withTransaction(async (client) => {
      const result = await client.query<StateRow>(
        "SELECT state FROM telegram_legacy_state WHERE namespace = $1 FOR UPDATE",
        ["legacy-pipeline"],
      );
      if (!result.rows[0]) throw new Error("Telegram pipeline PostgreSQL state has not been initialized.");
      const state = result.rows[0].state;
      const returned = (args[0] as (draft: TelegramDbSchema) => unknown)(state);
      await client.query(
        "UPDATE telegram_legacy_state SET state = $1::jsonb, revision = revision + 1, updated_at = NOW() WHERE namespace = $2",
        [JSON.stringify(state), "legacy-pipeline"],
      );
      return returned;
    });
  }
  if (mutating.has(method)) {
    return withTransaction(async (client) => {
      const selected = await client.query<StateRow>(
        "SELECT state FROM telegram_legacy_state WHERE namespace = $1 FOR UPDATE",
        ["legacy-pipeline"],
      );
      if (!selected.rows[0]) throw new Error("Telegram pipeline PostgreSQL state has not been initialized.");
      const changed = invokeTelegramDbMethodWithState(method, args, selected.rows[0].state);
      await client.query(
        "UPDATE telegram_legacy_state SET state = $1::jsonb, revision = revision + 1, updated_at = NOW() WHERE namespace = $2",
        [JSON.stringify(changed.state), "legacy-pipeline"],
      );
      return changed.result;
    });
  }
  throw new Error(`Unsupported Telegram pipeline database operation: ${method}`);
}

export const PgTelegramDb = new Proxy({} as Record<string, (...args: unknown[]) => Promise<any>>, {
  get: (_target, property) => typeof property === "string" ? (...args: unknown[]) => invoke(property, args) : undefined,
});
