import { unstable_cache } from "next/cache";

// Cached for 60s. Falls back gracefully on network failure.
export const getEthUsd = unstable_cache(
  async (): Promise<number> => {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
        { signal: ctrl.signal, next: { revalidate: 60 } },
      );
      clearTimeout(to);
      if (!res.ok) throw new Error("non-200");
      const data = (await res.json()) as { ethereum?: { usd?: number } };
      const v = data.ethereum?.usd;
      if (typeof v === "number" && v > 0) return v;
      throw new Error("malformed");
    } catch {
      return 3400; // fallback
    }
  },
  ["eth-usd"],
  { revalidate: 60, tags: ["eth-usd"] },
);
