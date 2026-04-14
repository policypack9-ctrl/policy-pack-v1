import { NextResponse } from "next/server";

// A simple in-memory store for rate limiting with auto-cleanup to prevent memory leaks.
// Note: In a real production environment with multiple edge/serverless nodes,
// you should use Redis (e.g. Upstash) for a distributed rate limiter.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

// Cleanup interval (e.g., every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupOldEntries() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [key, record] of rateLimitMap.entries()) {
      // If the record is older than the cleanup interval, remove it
      if (now - record.lastReset > CLEANUP_INTERVAL_MS) {
        rateLimitMap.delete(key);
      }
    }
    lastCleanup = now;
  }
}

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export function rateLimit(
  request: Request,
  action: string,
  options: RateLimitOptions = { limit: 5, windowMs: 60 * 1000 }
) {
  // Periodically clean up the map to avoid memory leaks
  cleanupOldEntries();

  // Improve IP extraction to handle common proxy setups more safely
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown_ip";
  const key = `${action}:${ip}`;

  const now = Date.now();
  const record = rateLimitMap.get(key) ?? { count: 0, lastReset: now };

  if (now - record.lastReset > options.windowMs) {
    // Reset window
    record.count = 1;
    record.lastReset = now;
  } else {
    record.count++;
  }

  rateLimitMap.set(key, record);

  if (record.count > options.limit) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  return null;
}
