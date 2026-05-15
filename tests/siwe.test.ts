import { describe, it, expect } from "vitest";
import {
  buildSiweMessage,
  parseSiweFields,
  validateSiweMessage,
} from "@/lib/siwe";

const VALID_ADDR = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("SIWE message", () => {
  it("parses what build produces", () => {
    const msg = buildSiweMessage({
      address: VALID_ADDR,
      nonce: "deadbeefcafe",
      domain: "strata.local",
      uri: "https://strata.local",
    });
    const f = parseSiweFields(msg);
    expect(f.address).toBe(VALID_ADDR);
    expect(f.nonce).toBe("deadbeefcafe");
    expect(f.domain).toBe("strata.local");
    expect(f.uri).toBe("https://strata.local");
    expect(f.issuedAt).toBeTruthy();
  });
});

describe("SIWE validator", () => {
  function freshMessage() {
    return buildSiweMessage({
      address: VALID_ADDR,
      nonce: "n1",
      domain: "strata.local",
      uri: "https://strata.local",
    });
  }
  const expected = {
    host: "strata.local",
    origin: "https://strata.local",
    nonce: "n1",
  };

  it("accepts a fresh, matching message", () => {
    const f = parseSiweFields(freshMessage());
    expect(validateSiweMessage(f, expected)).toEqual({ ok: true });
  });

  it("rejects domain mismatch (replay from another site)", () => {
    const msg = buildSiweMessage({
      address: VALID_ADDR,
      nonce: "n1",
      domain: "evil.com",
      uri: "https://strata.local",
    });
    const r = validateSiweMessage(parseSiweFields(msg), expected) as any;
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("domain mismatch");
  });

  it("rejects uri mismatch", () => {
    const msg = buildSiweMessage({
      address: VALID_ADDR,
      nonce: "n1",
      domain: "strata.local",
      uri: "https://evil.com",
    });
    const r = validateSiweMessage(parseSiweFields(msg), expected) as any;
    expect(r.reason).toBe("uri mismatch");
  });

  it("rejects nonce mismatch", () => {
    const f = parseSiweFields(freshMessage());
    const r = validateSiweMessage(f, { ...expected, nonce: "other" }) as any;
    expect(r.reason).toBe("nonce mismatch");
  });

  it("rejects invalid address shape", () => {
    const msg = buildSiweMessage({
      address: "0xnothex",
      nonce: "n1",
      domain: "strata.local",
      uri: "https://strata.local",
    });
    const r = validateSiweMessage(parseSiweFields(msg), expected) as any;
    expect(r.reason).toBe("invalid address");
  });

  it("rejects a message older than freshness window", () => {
    const f = parseSiweFields(freshMessage());
    const r = validateSiweMessage(f, {
      ...expected,
      now: Date.now() + 10 * 60_000,
    }) as any;
    expect(r.reason).toBe("message too old");
  });
});
