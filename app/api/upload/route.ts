import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { requireUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { sniffImage } from "@/lib/image-sniff";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  let me;
  try {
    me = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // 20 uploads / hour per user.
  if (!rateLimit(`upload:${me.id}`, 20, 60 * 60_000))
    return NextResponse.json({ error: "rate limited" }, { status: 429 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "file required" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "file too large" }, { status: 400 });
  if (file.size < 12)
    return NextResponse.json({ error: "file too small" }, { status: 400 });

  const buf = new Uint8Array(await file.arrayBuffer());
  // Trust magic bytes, never the client-supplied mime.
  const sniffed = sniffImage(buf);
  if (!sniffed)
    return NextResponse.json({ error: "unsupported image type" }, { status: 400 });

  const dir = path.join(process.cwd(), "public", "uploads");
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });

  // Random filename — no user input in the path.
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${sniffed.ext}`;
  await writeFile(path.join(dir, name), buf);

  return NextResponse.json({ url: `/uploads/${name}` });
}
