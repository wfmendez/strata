import { NextRequest, NextResponse } from "next/server";
import { setNonceCookie } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`nonce:${ip}`, 20, 60_000))
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  const nonce = crypto.randomUUID().replace(/-/g, "");
  setNonceCookie(nonce);
  return NextResponse.json({ nonce });
}
