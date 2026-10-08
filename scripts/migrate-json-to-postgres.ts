import { closePostgres, initializePostgres, query } from "../server/db/client";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL to the existing Render PostgreSQL connection before running this migration.");
  await initializePostgres();
  const report = await query<{
    records_discovered: string;
    records_migrated: string;
    records_deduplicated: string;
    records_skipped: string;
    records_failed: string;
  }>(`
    SELECT
      COALESCE(SUM(records_discovered), 0)::text AS records_discovered,
      COALESCE(SUM(records_migrated), 0)::text AS records_migrated,
      COALESCE(SUM(records_deduplicated), 0)::text AS records_deduplicated,
      COALESCE(SUM(records_skipped), 0)::text AS records_skipped,
      COALESCE(SUM(records_failed), 0)::text AS records_failed
    FROM persistence_migration_log
  `);
  const userRows = await query<{ profile_count: string; state_count: string }>(`
    SELECT (SELECT COUNT(*) FROM app_users)::text AS profile_count,
           (SELECT COUNT(*) FROM user_app_state)::text AS state_count
  `);
  console.log("PostgreSQL migration report");
  console.log(JSON.stringify({
    ...report.rows[0],
    migrated_user_profiles: Number(userRows.rows[0]?.profile_count || 0),
    migrated_user_states: Number(userRows.rows[0]?.state_count || 0),
    note: "Existing Firestore users migrate on their next successful sign-in.",
  }, null, 2));
  const failed = Number(report.rows[0]?.records_failed || 0);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("PostgreSQL migration failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closePostgres());
