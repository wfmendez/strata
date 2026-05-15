import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "strata_session";
const NONCE_COOKIE = "strata_nonce";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = Awaited<ReturnType<typeof getSessionUser>>;

export async function getSessionUser() {
  const c = cookies();
  const userId = c.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function getCurrentUser() {
  const user = await getSessionUser();
  if (user) return user;
  // Dev fallback so server pages don't crash before sign-in.
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
  cookies().set(SESSION_COOKIE, userId, {
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
  cookies().set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
}

export function readNonceCookie() {
  return cookies().get(NONCE_COOKIE)?.value ?? null;
}

export function clearNonceCookie() {
  cookies().delete(NONCE_COOKIE);
}
