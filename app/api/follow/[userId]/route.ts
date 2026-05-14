import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function PUT(_: Request, { params }: { params: { userId: string } }) {
  const me = await getCurrentUser();
  if (me.id === params.userId)
    return NextResponse.json({ error: "cannot follow self" }, { status: 400 });
  try {
    await prisma.follow.create({
      data: { followerId: me.id, followingId: params.userId },
    });
  } catch {
    /* idempotent — already following */
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { userId: string } }) {
  const me = await getCurrentUser();
  await prisma.follow
    .delete({
      where: { followerId_followingId: { followerId: me.id, followingId: params.userId } },
    })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}
