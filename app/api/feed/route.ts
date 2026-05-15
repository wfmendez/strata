import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { enrichPostsForUser } from "@/lib/feed-enrich";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const cursor = Number(searchParams.get("cursor") ?? 0);
  const pageSize = Math.min(Number(searchParams.get("pageSize") ?? 20), 50);
  const filter = searchParams.get("filter");

  const feed = await prisma.feed.findUnique({ where: { userId: me.id } });
  const allIds: string[] = feed ? JSON.parse(feed.postIds) : [];
  const slice = allIds.slice(cursor, cursor + pageSize * 3);

  const posts = await prisma.post.findMany({
    where: { id: { in: slice }, ...(filter ? { type: filter } : {}) },
    include: {
      creator: {
        select: { id: true, username: true, avatar: true, walletAddress: true },
      },
    },
  });

  const byId = new Map(posts.map((p) => [p.id, p]));
  const ordered = slice
    .map((id) => byId.get(id))
    .filter(Boolean)
    .slice(0, pageSize) as typeof posts;

  const enriched = await enrichPostsForUser(ordered, me.id);

  return NextResponse.json({
    posts: enriched,
    nextCursor: cursor + ordered.length,
    hasMore: cursor + ordered.length < allIds.length,
  });
}
