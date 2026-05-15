import { createHmac, timingSafeEqual } from "node:crypto";

const DEV_FALLBACK = "dev-only-insecure-secret-please-set-SESSION_SECRET";

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production (>= 32 chars)");
  }
  if (!(globalThis as any).__strata_warned_secret) {
    (globalThis as any).__strata_warned_secret = true;
    console.warn(
      "[strata] SESSION_SECRET not set — using insecure dev fallback. Set it in .env.",
    );
  }
  return DEV_FALLBACK;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

/**
 * Sign an arbitrary JSON-serializable payload with HMAC-SHA256.
 * Format: `<base64url(payload)>.<base64url(hmac)>`
 */
export function signToken(payload: Record<string, unknown>): string {
  const data = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(createHmac("sha256", getSecret()).update(data).digest());
  return `${data}.${sig}`;
}

/**
 * Verify a token signed by signToken. Returns the payload or null on
 * tampering, malformed input, missing fields, or expired `exp`.
 */
export function verifyToken<T = Record<string, unknown>>(
  token: string | undefined | null,
): (T & { exp?: number; iat?: number }) | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  let expected: Buffer;
  let got: Buffer;
  try {
    expected = createHmac("sha256", getSecret()).update(data).digest();
    got = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }
  if (expected.length !== got.length) return null;
  if (!timingSafeEqual(expected, got)) return null;
  let payload: any;
  try {
    payload = JSON.parse(Buffer.from(data, "base64url").toString());
  } catch {
    return null;
  }
  if (typeof payload?.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload as T & { exp?: number; iat?: number };
}
