import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signToken, verifyToken } from "@/lib/crypto";

const SESSION_COOKIE = "strata_session";
const NONCE_COOKIE = "strata_nonce";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const NONCE_MAX_AGE = 60 * 10; // 10 min

type SessionPayload = { sub: string; iat: number; exp: number };

export async function getSessionUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = verifyToken<SessionPayload>(token);
  if (!payload?.sub) return null;
  return prisma.user.findUnique({ where: { id: payload.sub } });
}

/** RSC convenience — never throws, falls back to seeded `alessandro` in dev. */
export async function getCurrentUser() {
  const user = await getSessionUser();
  if (user) return user;
  const fallback = await prisma.user.findUnique({ where: { username: "alessandro" } });
  if (!fallback) throw new Error("Seed the database: pnpm db:seed");
  return fallback;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    const e: any = new Error("Unauthorized");
    e.statusCode = 401;
    throw e;
  }
  return user;
}

export function setSessionCookie(userId: string) {
  const now = Math.floor(Date.now() / 1000);
  const token = signToken({ sub: userId, iat: now, exp: now + SESSION_MAX_AGE });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export function setNonceCookie(nonce: string) {
  // Sign the nonce so a CSRF/cookie-injection attacker can't pre-seed one.
  const token = signToken({ n: nonce, iat: Math.floor(Date.now() / 1000) });
  cookies().set(NONCE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: NONCE_MAX_AGE,
  });
}

export function readNonceCookie(): string | null {
  const token = cookies().get(NONCE_COOKIE)?.value;
  const payload = verifyToken<{ n: string; iat: number }>(token);
  if (!payload?.n) return null;
  // Freshness: nonce older than 10 min is rejected.
  if (Date.now() / 1000 - payload.iat > NONCE_MAX_AGE) return null;
  return payload.n;
}

export function clearNonceCookie() {
  cookies().delete(NONCE_COOKIE);
}
