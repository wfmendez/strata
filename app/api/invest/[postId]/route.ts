import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } },
) {
  let me;
  try {
    me = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!rateLimit(`invest:${me.id}`, 30, 60_000))
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  const { amountEth } = await req.json();
  if (!amountEth || amountEth <= 0)
    return NextResponse.json({ error: "amountEth required" }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!post || post.type !== "LISTING")
    return NextResponse.json({ error: "not a listing" }, { status: 404 });
  if (post.minInvest && amountEth < post.minInvest)
    return NextResponse.json(
      { error: `min invest is ${post.minInvest} ETH` },
      { status: 400 },
    );

  const fresh = await prisma.user.findUnique({ where: { id: me.id } });
  if (!fresh || fresh.ethBalance < amountEth)
    return NextResponse.json({ error: "insufficient balance" }, { status: 400 });

  const tokenPrice = post.priceEth! / (post.tokenSupply ?? 1000);
  const tokens = Math.max(1, Math.floor(amountEth / tokenPrice));

  const result = await prisma.$transaction([
    prisma.user.update({
      where: { id: me.id },
      data: { ethBalance: { decrement: amountEth } },
    }),
    prisma.post.update({
      where: { id: post.id },
      data: { tokensSold: { increment: tokens } },
    }),
    prisma.investment.create({
      data: { userId: me.id, postId: post.id, amountEth, tokens },
    }),
    prisma.holding.upsert({
      where: {
        userId_tokenSymbol: { userId: me.id, tokenSymbol: post.tokenSymbol! },
      },
      update: { tokens: { increment: tokens } },
      create: {
        userId: me.id,
        tokenSymbol: post.tokenSymbol!,
        tokens,
        entryPrice: tokenPrice,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, tokens, balance: result[0].ethBalance });
}
