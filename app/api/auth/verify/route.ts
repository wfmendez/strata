import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { prisma } from "@/lib/prisma";
import {
  clearNonceCookie,
  readNonceCookie,
  setSessionCookie,
} from "@/lib/session";
import { parseSiweFields } from "@/lib/siwe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { message, signature } = await req.json();
  if (typeof message !== "string" || typeof signature !== "string")
    return NextResponse.json({ error: "message + signature required" }, { status: 400 });

  const { address, nonce } = parseSiweFields(message);
  const expectedNonce = readNonceCookie();
  if (!expectedNonce || nonce !== expectedNonce)
    return NextResponse.json({ error: "invalid nonce" }, { status: 401 });

  let ok = false;
  try {
    ok = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    ok = false;
  }
  if (!ok) return NextResponse.json({ error: "invalid signature" }, { status: 401 });

  const lower = address.toLowerCase();
  let user = await prisma.user.findFirst({
    where: { walletAddress: { equals: lower } },
  });
  if (!user) {
    // Auto-provision a user for a fresh wallet.
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
  clearNonceCookie();
  return NextResponse.json({ user });
}
