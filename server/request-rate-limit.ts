import type { NextFunction, Request, Response } from "express";

type RateLimitBucket = { count: number; resetAt: number };

/** Small in-process guard for expensive public AI routes. */
export function createRequestRateLimit(options: { windowMs: number; maxRequests: number }) {
  const buckets = new Map<string, RateLimitBucket>();
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }
    if (bucket.count >= options.maxRequests) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      res.status(429).json({ success: false, error: "Too many AI requests. Please wait a moment and try again." });
      return;
    }
    bucket.count += 1;
    if (buckets.size > 5000) {
      for (const [address, entry] of buckets) if (entry.resetAt <= now) buckets.delete(address);
    }
    next();
  };
}
