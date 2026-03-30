import { NextRequest, NextResponse } from "next/server";

interface BucketRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, BucketRecord>();

interface EnforceRateLimitOptions {
  bucket: string;
  max: number;
  windowMs: number;
}

function getClientIp(req: NextRequest): string {
  const header =
    req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
  const first = header.split(",")[0]?.trim();
  return first || "unknown";
}

export function enforceRateLimit(
  req: NextRequest,
  options: EnforceRateLimitOptions,
): NextResponse | null {
  const now = Date.now();
  const ip = getClientIp(req);
  const key = `${options.bucket}:${ip}`;
  const current = store.get(key);

  if (!current || current.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (current.count >= options.max) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000),
    );
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please try again shortly.",
        retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfterSeconds.toString(),
        },
      },
    );
  }

  current.count += 1;
  store.set(key, current);
  return null;
}
