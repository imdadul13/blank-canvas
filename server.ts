import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import fmgeRoutes from "./server/fmge-routes";
import { startBackgroundSyncDaemon } from "./server/telegram-service";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Mount API routes
  app.use(fmgeRoutes);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "FMGE Study Tracker API" });
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
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Start background sync daemon
    startBackgroundSyncDaemon(60);
  });
}

startServer();
