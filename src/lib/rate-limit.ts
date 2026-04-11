import { NextResponse } from "next/server";

// A simple in-memory store for rate limiting. 
// Note: In a real production environment with multiple edge/serverless nodes,
// you should use Redis (e.g. Upstash) for a distributed rate limiter.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export function rateLimit(
  request: Request,
  action: string,
  options: RateLimitOptions = { limit: 5, windowMs: 60 * 1000 }
) {
  // Use x-forwarded-for or fallback to an unknown string.
  // In Next.js App Router API, we can get IP from headers if running on Vercel/proxies
  const ip = request.headers.get("x-forwarded-for") ?? "unknown_ip";
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
