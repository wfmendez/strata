import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { enqueueFanOut } from "@/lib/fanout";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let me;
  try {
    me = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 10 posts / 5 minutes per user.
  if (!rateLimit(`posts:${me.id}`, 10, 5 * 60_000))
    return NextResponse.json({ error: "rate limited" }, { status: 429 });

  const body = await req.json();
  if (!body?.type || typeof body.content !== "string" || !body.content.trim())
    return NextResponse.json({ error: "type and content required" }, { status: 400 });
  if (!["LISTING", "MARKET", "PORTFOLIO"].includes(body.type))
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  if (body.content.length > 1000)
    return NextResponse.json({ error: "content too long" }, { status: 400 });

  // Sanitize imageUrl — only accept our upload paths or known image hosts.
  const imageUrl = sanitizeImageUrl(body.imageUrl);

  const post = await prisma.post.create({
    data: {
      type: body.type,
      content: body.content.trim(),
      creatorId: me.id,
      imageUrl,
      address: body.address ?? null,
      priceEth: body.priceEth ?? null,
      yieldAPY: body.yieldAPY ?? null,
      tokenSymbol: body.tokenSymbol ?? null,
      tokenSupply: body.tokenSupply ?? null,
      minInvest: body.minInvest ?? null,
      chartData: body.chartData ?? null,
    },
  });

  enqueueFanOut({ postId: post.id, creatorId: me.id });
  return NextResponse.json({ post }, { status: 201 });
}

const ALLOWED_IMG_HOSTS = new Set([
  "images.unsplash.com",
  "i.pravatar.cc",
  "picsum.photos",
]);

function sanitizeImageUrl(url: unknown): string | null {
  if (typeof url !== "string" || !url) return null;
  if (url.startsWith("/uploads/")) return url;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    if (!ALLOWED_IMG_HOSTS.has(u.host)) return null;
    return u.toString();
  } catch {
    return null;
  }
}
