import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { enqueueFanOut } from "@/lib/fanout";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  const body = await req.json();

  if (!body?.type || !body?.content?.trim()) {
    return NextResponse.json({ error: "type and content required" }, { status: 400 });
  }
  if (!["LISTING", "MARKET", "PORTFOLIO"].includes(body.type)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      type: body.type,
      content: body.content.trim(),
      creatorId: me.id,
      imageUrl: body.imageUrl ?? null,
      address: body.address ?? null,
      priceEth: body.priceEth ?? null,
      yieldAPY: body.yieldAPY ?? null,
      tokenSymbol: body.tokenSymbol ?? null,
      tokenSupply: body.tokenSupply ?? null,
      minInvest: body.minInvest ?? null,
      chartData: body.chartData ?? null,
    },
  });

  enqueueFanOut({ postId: post.id, creatorId: me.id });
  return NextResponse.json({ post }, { status: 201 });
}
