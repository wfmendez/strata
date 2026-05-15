import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { enrichPostsForUser } from "@/lib/feed-enrich";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      creator: { select: { id: true, username: true, avatar: true, walletAddress: true } },
    },
  });
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  const [enriched] = await enrichPostsForUser([post], me.id);
  return NextResponse.json({ post: enriched });
}
