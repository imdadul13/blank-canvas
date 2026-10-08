import { withTransaction, query } from "./client";

export type JsonObject = Record<string, unknown>;

export async function getUserProfile(uid: string): Promise<JsonObject | null> {
  const result = await query<{ profile: JsonObject }>("SELECT profile FROM app_users WHERE id = $1", [uid]);
  return result.rows[0]?.profile ?? null;
}

export async function saveUserProfile(uid: string, profile: JsonObject): Promise<void> {
  const email = typeof profile.email === "string" ? profile.email : "";
  const displayName = typeof profile.displayName === "string" ? profile.displayName : null;
  const photoURL = typeof profile.photoURL === "string" ? profile.photoURL : null;
  await query(
    `INSERT INTO app_users (id, email, display_name, photo_url, profile)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       display_name = EXCLUDED.display_name,
       photo_url = EXCLUDED.photo_url,
       profile = app_users.profile || EXCLUDED.profile,
       updated_at = NOW()`,
    [uid, email, displayName, photoURL, JSON.stringify(profile)],
  );
}

export async function migrateLegacyUserProfile(uid: string, profile: JsonObject): Promise<{ migrated: boolean; profile: JsonObject }> {
  return withTransaction(async (client) => {
    const email = typeof profile.email === "string" ? profile.email : "";
    const displayName = typeof profile.displayName === "string" ? profile.displayName : null;
    const photoURL = typeof profile.photoURL === "string" ? profile.photoURL : null;
    const insert = await client.query(
      `INSERT INTO app_users(id, email, display_name, photo_url, profile)
       VALUES ($1, $2, $3, $4, $5::jsonb) ON CONFLICT (id) DO NOTHING`,
      [uid, email, displayName, photoURL, JSON.stringify(profile)],
    );
    await client.query(
      `INSERT INTO persistence_migration_log(source_key, records_discovered, records_migrated, records_skipped)
       VALUES ($1, 1, $2, $3) ON CONFLICT (source_key) DO NOTHING`,
      [`firestore/users/${uid}`, insert.rowCount ? 1 : 0, insert.rowCount ? 0 : 1],
    );
    const stored = await client.query<{ profile: JsonObject }>("SELECT profile FROM app_users WHERE id = $1", [uid]);
    return { migrated: Boolean(insert.rowCount), profile: stored.rows[0]?.profile ?? profile };
  });
}

export async function getUserAppState(uid: string): Promise<JsonObject | null> {
  const result = await query<{ state: JsonObject }>("SELECT state FROM user_app_state WHERE user_id = $1", [uid]);
  return result.rows[0]?.state ?? null;
}

export async function saveUserAppState(uid: string, state: JsonObject): Promise<void> {
  await withTransaction(async (client) => {
    await client.query("INSERT INTO app_users(id) VALUES ($1) ON CONFLICT (id) DO NOTHING", [uid]);
    await client.query(
      `INSERT INTO user_app_state(user_id, state, revision)
       VALUES ($1, $2::jsonb, 1)
       ON CONFLICT (user_id) DO UPDATE SET
         state = EXCLUDED.state,
         revision = user_app_state.revision + 1,
         updated_at = NOW()`,
      [uid, JSON.stringify(state)],
    );
  });
}

export async function migrateLegacyUserAppState(uid: string, state: JsonObject): Promise<{ migrated: boolean; state: JsonObject }> {
  return withTransaction(async (client) => {
    await client.query("INSERT INTO app_users(id) VALUES ($1) ON CONFLICT (id) DO NOTHING", [uid]);
    const insert = await client.query(
      `INSERT INTO user_app_state(user_id, state, revision)
       VALUES ($1, $2::jsonb, 1) ON CONFLICT (user_id) DO NOTHING`,
      [uid, JSON.stringify(state)],
    );
    await client.query(
      `INSERT INTO persistence_migration_log(source_key, records_discovered, records_migrated, records_skipped)
       VALUES ($1, 1, $2, $3) ON CONFLICT (source_key) DO NOTHING`,
      [`firestore/userData/${uid}`, insert.rowCount ? 1 : 0, insert.rowCount ? 0 : 1],
    );
    const stored = await client.query<{ state: JsonObject }>("SELECT state FROM user_app_state WHERE user_id = $1", [uid]);
    return { migrated: Boolean(insert.rowCount), state: stored.rows[0]?.state ?? state };
  });
}

const ALLOWED_DOCUMENT_KEYS = new Set(["coach_sessions"]);

export async function getUserDocument(uid: string, key: string): Promise<unknown | null> {
  if (!ALLOWED_DOCUMENT_KEYS.has(key)) throw new Error("Unsupported user document key");
  const result = await query<{ document: unknown }>(
    "SELECT document FROM user_app_documents WHERE user_id = $1 AND document_key = $2",
    [uid, key],
  );
  return result.rows[0]?.document ?? null;
}

export async function saveUserDocument(uid: string, key: string, document: unknown): Promise<void> {
  if (!ALLOWED_DOCUMENT_KEYS.has(key)) throw new Error("Unsupported user document key");
  await withTransaction(async (client) => {
    await client.query("INSERT INTO app_users(id) VALUES ($1) ON CONFLICT (id) DO NOTHING", [uid]);
    await client.query(
      `INSERT INTO user_app_documents(user_id, document_key, document, revision)
       VALUES ($1, $2, $3::jsonb, 1)
       ON CONFLICT (user_id, document_key) DO UPDATE SET
         document = EXCLUDED.document, revision = user_app_documents.revision + 1, updated_at = NOW()`,
      [uid, key, JSON.stringify(document)],
    );
  });
}

export async function migrateLegacyUserDocument(uid: string, key: string, document: unknown): Promise<{ migrated: boolean; document: unknown }> {
  if (!ALLOWED_DOCUMENT_KEYS.has(key)) throw new Error("Unsupported user document key");
  return withTransaction(async (client) => {
    await client.query("INSERT INTO app_users(id) VALUES ($1) ON CONFLICT (id) DO NOTHING", [uid]);
    const insert = await client.query(
      `INSERT INTO user_app_documents(user_id, document_key, document, revision)
       VALUES ($1, $2, $3::jsonb, 1) ON CONFLICT (user_id, document_key) DO NOTHING`,
      [uid, key, JSON.stringify(document)],
    );
    await client.query(
      `INSERT INTO persistence_migration_log(source_key, records_discovered, records_migrated, records_skipped)
       VALUES ($1, 1, $2, $3) ON CONFLICT (source_key) DO NOTHING`,
      [`browser/${key}/${uid}`, insert.rowCount ? 1 : 0, insert.rowCount ? 0 : 1],
    );
    const stored = await client.query<{ document: unknown }>(
      "SELECT document FROM user_app_documents WHERE user_id = $1 AND document_key = $2", [uid, key],
    );
    return { migrated: Boolean(insert.rowCount), document: stored.rows[0]?.document ?? document };
  });
}

export async function getRuntimeSecret(name: string): Promise<string | null> {
  const result = await query<{ value: string }>("SELECT value FROM runtime_secrets WHERE name = $1", [name]);
  return result.rows[0]?.value ?? null;
}

export async function saveRuntimeSecret(name: string, value: string): Promise<void> {
  await query(
    `INSERT INTO runtime_secrets(name, value) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [name, value],
  );
}
