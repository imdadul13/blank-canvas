import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

/**
 * Resiliently resolve GEMINI_API_KEY from:
 * 1. process.env.GEMINI_API_KEY (stripping any copied quotes or trailing whitespace)
 * 2. server/data/gemini_key.json (runtime persistence store on Render)
 * 3. .env file fallback
 */
export function getGeminiApiKey(): string {
  let apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && typeof apiKey === "string") {
    apiKey = apiKey.trim().replace(/^["']|["']$/g, "");
    if (apiKey) {
      process.env.GEMINI_API_KEY = apiKey;
      return apiKey;
    }
  }

  // Check persistent runtime key file (e.g. configured via in-app settings on Render)
  try {
    const keyFile = path.resolve(process.cwd(), "server/data/gemini_key.json");
    if (fs.existsSync(keyFile)) {
      const parsed = JSON.parse(fs.readFileSync(keyFile, "utf8"));
      if (parsed?.apiKey && typeof parsed.apiKey === "string") {
        apiKey = parsed.apiKey.trim().replace(/^["']|["']$/g, "");
        if (apiKey) {
          process.env.GEMINI_API_KEY = apiKey;
          return apiKey;
        }
      }
    }
  } catch (e) {}

  // Check local .env file fallback
  try {
    const envFile = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envFile)) {
      const raw = fs.readFileSync(envFile, "utf8");
      for (const line of raw.split("\n")) {
        const match = line.match(/^\s*GEMINI_API_KEY\s*=\s*(.*)$/);
        if (match) {
          apiKey = match[1].trim().replace(/^["']|["']$/g, "");
          if (apiKey) {
            process.env.GEMINI_API_KEY = apiKey;
            return apiKey;
          }
        }
      }
    }
  } catch (e) {
    console.warn("[Gemini] Failed to read .env file directly:", e);
  }

  return "";
}

/**
 * Initialize Google GenAI — reads GEMINI_API_KEY on every call so hot-reloads
 * and runtime updates take immediate effect.
 */
export function getAI(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.warn("[Gemini] GEMINI_API_KEY is not set — API calls will fail. Configure it in the Render dashboard or App Settings.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
}
