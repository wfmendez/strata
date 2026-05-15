import { describe, it, expect } from "vitest";
import { ethToUsd, fmtEth, fmtUsd, shortAddr, timeAgo } from "@/lib/format";

describe("format helpers", () => {
  it("ethToUsd uses default and override", () => {
    expect(ethToUsd(2)).toBe(6800);
    expect(ethToUsd(2, 4000)).toBe(8000);
  });

  it("fmtEth picks precision by magnitude", () => {
    expect(fmtEth(0.123456)).toBe("0.123 ETH");
    expect(fmtEth(12.345)).toBe("12.35 ETH");
  });

  it("fmtUsd is USD-localized", () => {
    expect(fmtUsd(1234)).toMatch(/\$1,234/);
  });

  it("shortAddr truncates", () => {
    expect(shortAddr("0x1234567890abcdef1234567890abcdef12345678")).toBe(
      "0x1234…5678",
    );
    expect(shortAddr("")).toBe("");
  });

  it("timeAgo returns a unit suffix", () => {
    expect(timeAgo(new Date(Date.now() - 3_000))).toMatch(/s$/);
    expect(timeAgo(new Date(Date.now() - 5 * 60_000))).toMatch(/m$/);
    expect(timeAgo(new Date(Date.now() - 3 * 3600_000))).toMatch(/h$/);
    expect(timeAgo(new Date(Date.now() - 3 * 86400_000))).toMatch(/d$/);
  });
});
