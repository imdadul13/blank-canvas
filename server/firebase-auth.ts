import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

type FirebaseClaims = {
  aud?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  sub?: string;
  email?: string;
  auth_time?: number;
};

type FirebaseSigningCertificates = {
  keys: Record<string, string>;
  expiresAt: number;
};

let certificateCache: FirebaseSigningCertificates | null = null;

function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

async function getSigningCertificate(keyId: string, forceRefresh = false): Promise<string> {
  if (forceRefresh || !certificateCache || certificateCache.expiresAt <= Date.now()) {
    let response: Awaited<ReturnType<typeof fetch>>;
    try {
      response = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
    } catch {
      throw new Error("Firebase signing certificates are temporarily unavailable.");
    }
    if (!response.ok) throw new Error("Firebase signing certificates are temporarily unavailable.");

    const maxAge = response.headers.get("cache-control")?.match(/max-age=(\d+)/i)?.[1];
    const certificates = await response.json() as Record<string, string>;
    certificateCache = {
      keys: certificates,
      expiresAt: Date.now() + (Number(maxAge || 300) * 1000),
    };
  }

  const certificate = certificateCache.keys[keyId];
  if (!certificate) {
    // Key rotation can happen before the previous cache expires. Refresh once.
    if (!forceRefresh) return getSigningCertificate(keyId, true);
    throw new Error("Unknown Firebase signing key.");
  }
  return certificate;
}

export async function verifyFirebaseIdToken(token: string): Promise<{ uid: string; email?: string }> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid Firebase ID token.");

  let header: { alg?: string; kid?: string };
  let claims: FirebaseClaims;
  try {
    header = JSON.parse(decodeBase64Url(parts[0]).toString("utf8"));
    claims = JSON.parse(decodeBase64Url(parts[1]).toString("utf8"));
  } catch {
    throw new Error("Invalid Firebase ID token.");
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || "one-shot-fmge";
  const now = Math.floor(Date.now() / 1000);
  if (
    header.alg !== "RS256" || !header.kid ||
    claims.aud !== projectId ||
    claims.iss !== `https://securetoken.google.com/${projectId}` ||
    typeof claims.sub !== "string" || claims.sub.length === 0 || claims.sub.length > 128 ||
    typeof claims.exp !== "number" || claims.exp <= now - 30 ||
    typeof claims.iat !== "number" || claims.iat > now + 30 ||
    typeof claims.auth_time !== "number" || claims.auth_time > now + 30
  ) {
    throw new Error("Invalid or expired Firebase ID token.");
  }

  const certificate = await getSigningCertificate(header.kid);
  const signature = decodeBase64Url(parts[2]);
  const validSignature = crypto.verify(
    "RSA-SHA256",
    Buffer.from(`${parts[0]}.${parts[1]}`),
    certificate,
    signature,
  );
  if (!validSignature) throw new Error("Invalid Firebase ID token signature.");

  return { uid: claims.sub, email: claims.email };
}

export function createRequireAppOwner(verifyToken = verifyFirebaseIdToken) {
  return async function requireAppOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authorization = req.header("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    res.status(401).json({ success: false, error: "Sign in to use this service." });
    return;
  }

  const ownerUid = process.env.APP_OWNER_UID?.trim();
  if (!ownerUid) {
    res.status(503).json({ success: false, error: "Owner access is not configured on the server." });
    return;
  }

  try {
    const user = await verifyToken(token);
    if (user.uid !== ownerUid) {
      res.status(403).json({ success: false, error: "This service is restricted to the app owner." });
      return;
    }
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed.";
    const status = message.includes("temporarily unavailable") ? 503 : 401;
    res.status(status).json({ success: false, error: status === 503 ? message : "Sign in again to continue." });
  }
}
}

export const requireAppOwner = createRequireAppOwner();

export async function requireAuthenticatedUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authorization = req.header("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    res.status(401).json({ success: false, error: "Sign in to access your saved study data." });
    return;
  }
  try {
    res.locals.firebaseUser = await verifyFirebaseIdToken(token);
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed.";
    const status = message.includes("temporarily unavailable") ? 503 : 401;
    res.status(status).json({ success: false, error: status === 503 ? message : "Sign in again to continue." });
  }
}
