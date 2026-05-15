import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

// Demo sign-in: pick a seeded user by username. Disabled when
// ALLOW_DEMO_AUTH=0 (production deploys should set this).
export async function POST(req: NextRequest) {
  if (process.env.ALLOW_DEMO_AUTH === "0")
    return NextResponse.json({ error: "demo auth disabled" }, { status: 403 });

  const { username } = await req.json();
  if (typeof username !== "string")
    return NextResponse.json({ error: "username required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  setSessionCookie(user.id);
  return NextResponse.json({ user });
}
