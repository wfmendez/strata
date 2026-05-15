import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });
  // Principle of least privilege: only return what the UI actually uses.
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      walletAddress: user.walletAddress,
      avatar: user.avatar,
    },
  });
}
