/**
 * In-memory fixed-window rate limiter. Returns `true` if the call is allowed.
 *
 * NOT suitable for serverless / multi-instance deploys — swap for
 * @upstash/ratelimit (Redis) or a similar shared store. The function shape
 * is identical, so call sites don't change.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

// Best-effort housekeeping. Runs every 5 min; safe to omit in serverless.
if (typeof setInterval !== "undefined" && !(globalThis as any).__strata_rl_gc) {
  (globalThis as any).__strata_rl_gc = setInterval(
    () => {
      const now = Date.now();
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    },
    5 * 60_000,
  ).unref?.();
}
