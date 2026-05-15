import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  let me;
  try {
    me = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // 60 toggles / minute per user — anti-spam.
  if (!rateLimit(`like:${me.id}`, 60, 60_000))
    return NextResponse.json({ error: "rate limited" }, { status: 429 });

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId: me.id, postId: params.id } },
  });
  if (existing) {
    await prisma.$transaction([
      prisma.like.delete({
        where: { userId_postId: { userId: me.id, postId: params.id } },
      }),
      prisma.post.update({
        where: { id: params.id },
        data: { likes: { decrement: 1 } },
      }),
    ]);
    return NextResponse.json({ liked: false });
  }
  await prisma.$transaction([
    prisma.like.create({ data: { userId: me.id, postId: params.id } }),
    prisma.post.update({
      where: { id: params.id },
      data: { likes: { increment: 1 } },
    }),
  ]);
  return NextResponse.json({ liked: true });
}
