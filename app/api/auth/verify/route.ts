import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { prisma } from "@/lib/prisma";
import {
  clearNonceCookie,
  readNonceCookie,
  setSessionCookie,
} from "@/lib/session";
import { parseSiweFields, validateSiweMessage } from "@/lib/siwe";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!rateLimit(`verify:${ipFrom(req)}`, 10, 60_000))
    return NextResponse.json({ error: "rate limited" }, { status: 429 });

  const { message, signature } = await req.json();
  if (typeof message !== "string" || typeof signature !== "string")
    return NextResponse.json({ error: "message + signature required" }, { status: 400 });

  // Always clear nonce after a verify attempt — succeeded or not — so failed
  // attempts can't be retried with the same nonce.
  const expectedNonce = readNonceCookie();
  clearNonceCookie();

  if (!expectedNonce)
    return NextResponse.json({ error: "no nonce — request /api/auth/nonce first" }, { status: 401 });

  const fields = parseSiweFields(message);
  const host = req.headers.get("host") ?? "";
  const origin =
    req.headers.get("origin") ??
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  const validation = validateSiweMessage(fields, {
    host,
    origin,
    nonce: expectedNonce,
  });
  if (!validation.ok)
    return NextResponse.json({ error: validation.reason }, { status: 401 });

  let ok = false;
  try {
    ok = await verifyMessage({
      address: fields.address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    ok = false;
  }
  if (!ok) return NextResponse.json({ error: "invalid signature" }, { status: 401 });

  const lower = fields.address.toLowerCase();
  let user = await prisma.user.findFirst({
    where: { walletAddress: { equals: lower } },
  });
  if (!user) {
    const username = "u_" + lower.slice(2, 8);
    user = await prisma.user.create({
      data: {
        walletAddress: lower,
        username,
        bio: "Connected via wallet.",
        avatar: `https://i.pravatar.cc/200?u=${lower}`,
      },
    });
    await prisma.feed.create({ data: { userId: user.id, postIds: "[]" } });
  }

  setSessionCookie(user.id);
  return NextResponse.json({
    user: pickPublic(user),
  });
}

function ipFrom(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "local"
  );
}

function pickPublic(u: { id: string; username: string; walletAddress: string; avatar: string | null }) {
  return { id: u.id, username: u.username, walletAddress: u.walletAddress, avatar: u.avatar };
}
