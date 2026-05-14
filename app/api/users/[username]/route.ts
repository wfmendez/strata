import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { username: string } }) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      _count: { select: { posts: true, followers: true, following: true } },
      holdings: true,
    },
  });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

  const posts = await prisma.post.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, username: true, avatar: true, walletAddress: true } },
    },
  });

  return NextResponse.json({ user, posts });
}
