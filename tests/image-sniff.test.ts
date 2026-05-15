import { describe, it, expect } from "vitest";
import { sniffImage } from "@/lib/image-sniff";

describe("sniffImage", () => {
  it("detects JPEG by magic bytes", () => {
    const buf = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(sniffImage(buf)).toEqual({ mime: "image/jpeg", ext: "jpg" });
  });

  it("detects PNG", () => {
    const buf = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(sniffImage(buf)).toEqual({ mime: "image/png", ext: "png" });
  });

  it("detects WEBP", () => {
    const buf = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(sniffImage(buf)).toEqual({ mime: "image/webp", ext: "webp" });
  });

  it("rejects HTML disguised as an image", () => {
    // "<!DOCTYPE html>..." with attacker-supplied Content-Type: image/jpeg
    const buf = new Uint8Array(Buffer.from("<!DOCTYPE html><script>"));
    expect(sniffImage(buf)).toBeNull();
  });

  it("rejects SVG (XML-based, can carry scripts)", () => {
    const buf = new Uint8Array(Buffer.from("<?xml version=\"1.0\"?><svg"));
    expect(sniffImage(buf)).toBeNull();
  });
});
