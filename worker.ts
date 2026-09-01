import { initTelegramCloudWorker } from "./server/telegram-worker";

console.log("==================================================");
console.log("ONE SHOT FMGE — CLOUD TELEGRAM WORKER PROCESS");
console.log("==================================================");

async function start() {
  const isConnected = await initTelegramCloudWorker();
  if (isConnected) {
    console.log("[Worker] Successfully connected to Telegram account.");
  } else {
    console.log("[Worker] Standing by. Awaiting user Telegram connection from web UI.");
  }
}

start();

process.on("SIGINT", () => {
  console.log("[Worker] Shutting down gracefully...");
  process.exit(0);
});
