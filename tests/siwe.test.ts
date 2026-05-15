import { describe, it, expect } from "vitest";
import { buildSiweMessage, parseSiweFields } from "@/lib/siwe";

describe("SIWE message", () => {
  it("roundtrips address and nonce through build + parse", () => {
    const message = buildSiweMessage({
      address: "0xabc123def4567890abc123def4567890abc12345",
      nonce: "deadbeefcafe",
      domain: "strata.local",
      uri: "https://strata.local",
    });
    const { address, nonce } = parseSiweFields(message);
    expect(address).toBe("0xabc123def4567890abc123def4567890abc12345");
    expect(nonce).toBe("deadbeefcafe");
  });

  it("includes required SIWE fields", () => {
    const msg = buildSiweMessage({
      address: "0xaa",
      nonce: "n1",
      domain: "d",
      uri: "u",
    });
    expect(msg).toContain("URI:");
    expect(msg).toContain("Version: 1");
    expect(msg).toContain("Chain ID: 1");
    expect(msg).toContain("Nonce: n1");
    expect(msg).toContain("Issued At:");
  });
});
