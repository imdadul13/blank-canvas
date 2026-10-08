import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

type JsonObject = Record<string, unknown>;
type UserStore = { profiles: Record<string, JsonObject>; states: Record<string, JsonObject>; documents: Record<string, Record<string, unknown>> };
const STORE_PATH = path.join(process.cwd(), "server", "data", "user-state.json");
const allowedDocumentKeys = new Set(["coach_sessions"]);
let inMemoryStore: UserStore | null = null;

function getStore(): UserStore {
  if (inMemoryStore) return inMemoryStore;
  try {
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as Partial<UserStore>;
    inMemoryStore = {
      profiles: parsed.profiles || {},
      states: parsed.states || {},
      documents: parsed.documents || {},
    };
  } catch {
    inMemoryStore = { profiles: {}, states: {}, documents: {} };
  }
  inMemoryStore.profiles ||= {};
  inMemoryStore.states ||= {};
  inMemoryStore.documents ||= {};
  return inMemoryStore;
}

function saveStore(): void {
  const dir = path.dirname(STORE_PATH);
  fs.mkdirSync(dir, { recursive: true });
  const tempPath = `${STORE_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(getStore()), { encoding: "utf8", mode: 0o600 });
  fs.renameSync(tempPath, STORE_PATH);
}

export async function getUserProfile(uid: string): Promise<JsonObject | null> { return getStore().profiles[uid] || null; }
export async function saveUserProfile(uid: string, profile: JsonObject): Promise<void> {
  getStore().profiles[uid] = { ...getStore().profiles[uid], ...profile, uid };
  saveStore();
}
export async function migrateLegacyUserProfile(uid: string, profile: JsonObject): Promise<{ migrated: boolean; profile: JsonObject }> {
  const store = getStore(); const existed = Boolean(store.profiles[uid]);
  if (!existed) { store.profiles[uid] = { ...profile, uid }; saveStore(); }
  return { migrated: !existed, profile: store.profiles[uid] };
}
export async function getUserAppState(uid: string): Promise<JsonObject | null> { return getStore().states[uid] || null; }
export async function saveUserAppState(uid: string, state: JsonObject): Promise<void> { getStore().states[uid] = state; saveStore(); }
export async function migrateLegacyUserAppState(uid: string, state: JsonObject): Promise<{ migrated: boolean; state: JsonObject }> {
  const store = getStore(); const existed = Boolean(store.states[uid]);
  if (!existed) { store.states[uid] = state; saveStore(); }
  return { migrated: !existed, state: store.states[uid] };
}
export async function getUserDocument(uid: string, key: string): Promise<unknown | null> {
  if (!allowedDocumentKeys.has(key)) throw new Error("Unsupported user document key");
  return getStore().documents[uid]?.[key] ?? null;
}
export async function saveUserDocument(uid: string, key: string, document: unknown): Promise<void> {
  if (!allowedDocumentKeys.has(key)) throw new Error("Unsupported user document key");
  const store = getStore(); store.documents[uid] ||= {}; store.documents[uid][key] = document; saveStore();
}
export async function migrateLegacyUserDocument(uid: string, key: string, document: unknown): Promise<{ migrated: boolean; document: unknown }> {
  if (!allowedDocumentKeys.has(key)) throw new Error("Unsupported user document key");
  const store = getStore(); store.documents[uid] ||= {}; const existed = key in store.documents[uid];
  if (!existed) { store.documents[uid][key] = document; saveStore(); }
  return { migrated: !existed, document: store.documents[uid][key] };
}

export async function getRuntimeSecret(name: string): Promise<string | null> {
  return name === "GEMINI_API_KEY" ? process.env.GEMINI_API_KEY || null : null;
}
export async function saveRuntimeSecret(name: string, value: string): Promise<void> {
  if (name !== "GEMINI_API_KEY") throw new Error("Unsupported runtime secret");
  process.env.GEMINI_API_KEY = value;
}

export async function getUserDocumentMigration(uid: string, key: string): Promise<unknown | null> {
  const store = getStore();
  const document = store.documents[uid]?.[key];
  if (document !== undefined) return document;
  const firestoreBackupPath = path.join(process.cwd(), "server", "data", "firestore-user-backup", `${crypto.createHash("sha256").update(uid).digest("hex")}.json`);
  try {
    const backup = JSON.parse(fs.readFileSync(firestoreBackupPath, "utf8")) as Record<string, unknown>;
    return backup[key] ?? null;
  } catch { return null; }
}
