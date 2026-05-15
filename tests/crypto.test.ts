import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-must-be-long-enough-to-pass-32-char-check";
});

// Import after env is set so the module reads the right secret.
const { signToken, verifyToken } = await import("@/lib/crypto");

describe("signed tokens", () => {
  it("roundtrips a payload", () => {
    const token = signToken({ sub: "user-123", iat: 1, exp: 9_999_999_999 });
    const payload = verifyToken<{ sub: string }>(token);
    expect(payload?.sub).toBe("user-123");
  });

  it("rejects a tampered payload", () => {
    const token = signToken({ sub: "alice", exp: 9_999_999_999 });
    const [data, sig] = token.split(".");
    const tamperedData = Buffer.from(JSON.stringify({ sub: "bob", exp: 9_999_999_999 })).toString("base64url");
    const tampered = `${tamperedData}.${sig}`;
    expect(verifyToken(tampered)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const token = signToken({ sub: "alice", exp: 9_999_999_999 });
    const bad = token.slice(0, -3) + "AAA";
    expect(verifyToken(bad)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = signToken({ sub: "alice", exp: 1 });
    expect(verifyToken(token)).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(verifyToken("not.a.token")).toBeNull();
    expect(verifyToken("")).toBeNull();
    expect(verifyToken(null)).toBeNull();
    expect(verifyToken(undefined)).toBeNull();
  });
});
