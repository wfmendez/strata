import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const cursor = Number(searchParams.get("cursor") ?? 0);
  const pageSize = Math.min(Number(searchParams.get("pageSize") ?? 20), 50);
  const filter = searchParams.get("filter"); // LISTING | MARKET | PORTFOLIO | null

  const feed = await prisma.feed.findUnique({ where: { userId: me.id } });
  const allIds: string[] = feed ? JSON.parse(feed.postIds) : [];
  const slice = allIds.slice(cursor, cursor + pageSize * 3); // overfetch for filter

  const posts = await prisma.post.findMany({
    where: { id: { in: slice }, ...(filter ? { type: filter } : {}) },
    include: {
      creator: {
        select: { id: true, username: true, avatar: true, walletAddress: true },
      },
      investments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { amountEth: true, createdAt: true },
      },
    },
  });

  // Preserve feed order
  const byId = new Map(posts.map((p) => [p.id, p]));
  const ordered = slice
    .map((id) => byId.get(id))
    .filter(Boolean)
    .slice(0, pageSize);

  const nextCursor = cursor + ordered.length;
  const hasMore = nextCursor < allIds.length;

  return NextResponse.json({ posts: ordered, nextCursor, hasMore });
}
