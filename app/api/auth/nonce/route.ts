import { NextResponse } from "next/server";
import { setNonceCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const nonce =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  setNonceCookie(nonce);
  return NextResponse.json({ nonce });
}
