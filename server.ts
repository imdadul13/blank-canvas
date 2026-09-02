import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import fmgeRoutes from "./server/fmge-routes";
import { startBackgroundSyncDaemon } from "./server/telegram-service";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const HOST = process.env.HOST || "0.0.0.0";

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Mount API routes
  app.use(fmgeRoutes);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "FMGE Study Tracker API",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            '**/server/data/**',
            '**/server/db/**',
            '**/data/telegram-knowledge-bank.json',
            '**/data/*.json',
            '**/scratch/**',
            '**/.gemini/**',
            '**/dist/**',
            '**/*.log',
          ],
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { maxAge: "1d", etag: true }));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`[Server] ONE SHOT FMGE running on http://${HOST}:${PORT} (${process.env.NODE_ENV || "development"})`);
    // Start background sync daemon
    startBackgroundSyncDaemon(60);
  });

  // Graceful shutdown handling
  const shutdown = (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log("[Server] Closed all remaining HTTP connections. Exiting process.");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("[Server] Forceful shutdown timeout exceeded. Exiting immediately.");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer();
