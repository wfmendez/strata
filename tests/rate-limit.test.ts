import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows up to the limit then blocks", () => {
    const key = "test-key-" + Math.random();
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(false);
  });

  it("keys are isolated", () => {
    const a = "a-" + Math.random();
    const b = "b-" + Math.random();
    expect(rateLimit(a, 1, 60_000)).toBe(true);
    expect(rateLimit(a, 1, 60_000)).toBe(false);
    expect(rateLimit(b, 1, 60_000)).toBe(true);
  });

  it("resets after the window", async () => {
    const key = "window-" + Math.random();
    expect(rateLimit(key, 1, 5)).toBe(true);
    expect(rateLimit(key, 1, 5)).toBe(false);
    await new Promise((r) => setTimeout(r, 15));
    expect(rateLimit(key, 1, 5)).toBe(true);
  });
});
