import { initTelegramCloudWorker } from "./server/telegram-worker";
import { closePostgres, initializePostgres } from "./server/db/client";

console.log("==================================================");
console.log("ONE SHOT FMGE — CLOUD TELEGRAM WORKER PROCESS");
console.log("==================================================");

async function start() {
  await initializePostgres();
  const isConnected = await initTelegramCloudWorker();
  if (isConnected) {
    console.log("[Worker] Successfully connected to Telegram account.");
  } else {
    console.log("[Worker] Standing by. Awaiting user Telegram connection from web UI.");
  }
}


start();

const shutdown = (signal: string) => {
  console.log(`[Worker] Received ${signal}. Shutting down gracefully...`);
  void closePostgres().finally(() => process.exit(0));
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("[Worker] Unhandled Promise Rejection:", reason instanceof Error ? reason.message : "unknown error");
});
