import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

type Window = `${number} ${"s" | "m" | "h"}`;

const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiters = new Map<string, Ratelimit>();
// DEV ONLY fallback when Upstash is not configured (see lib/env.ts).
const memory = new Map<string, { count: number; resetAt: number }>();

function windowMs(w: Window): number {
  const [n, unit] = w.split(" ");
  return Number(n) * { s: 1000, m: 60_000, h: 3_600_000 }[unit as "s"];
}

/** Fixed-window limit. Returns true when the call is allowed. */
export async function rateLimit(
  name: string,
  key: string,
  limit: number,
  window: Window,
): Promise<boolean> {
  if (redis) {
    const id = `${name}:${limit}:${window}`;
    let rl = limiters.get(id);
    if (!rl) {
      rl = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(limit, window),
        prefix: `rl:${name}`,
      });
      limiters.set(id, rl);
    }
    return (await rl.limit(key)).success;
  }

  const now = Date.now();
  const k = `${name}:${key}`;
  const entry = memory.get(k);
  if (!entry || entry.resetAt <= now) {
    memory.set(k, { count: 1, resetAt: now + windowMs(window) });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
