import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

async function authedAndLimited() {
  let me;
  try {
    me = await requireUser();
  } catch {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!rateLimit(`follow:${me.id}`, 60, 60_000))
    return { error: NextResponse.json({ error: "rate limited" }, { status: 429 }) };
  return { me };
}

export async function PUT(_: Request, { params }: { params: { userId: string } }) {
  const r = await authedAndLimited();
  if (r.error) return r.error;
  if (r.me.id === params.userId)
    return NextResponse.json({ error: "cannot follow self" }, { status: 400 });
  try {
    await prisma.follow.create({
      data: { followerId: r.me.id, followingId: params.userId },
    });
  } catch {
    /* idempotent — already following */
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { userId: string } }) {
  const r = await authedAndLimited();
  if (r.error) return r.error;
  await prisma.follow
    .delete({
      where: {
        followerId_followingId: { followerId: r.me.id, followingId: params.userId },
      },
    })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}
