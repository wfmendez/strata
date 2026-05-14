import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentUser();
  const [user, holdings, investments] = await Promise.all([
    prisma.user.findUnique({ where: { id: me.id } }),
    prisma.holding.findMany({ where: { userId: me.id } }),
    prisma.investment.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: "desc" },
      include: { post: { select: { tokenSymbol: true, address: true } } },
      take: 20,
    }),
  ]);

  // Mock "current price" — +5–15% drift from entry.
  const enriched = holdings.map((h) => {
    const drift = 1 + (Math.sin(h.id.charCodeAt(0)) * 0.1 + 0.05);
    const currentPrice = h.entryPrice * drift;
    const value = h.tokens * currentPrice;
    const gainPct = (drift - 1) * 100;
    return {
      ...h,
      currentPrice,
      value,
      gainPct,
    };
  });

  return NextResponse.json({ user, holdings: enriched, investments });
}
