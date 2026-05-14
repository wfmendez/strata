import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { shortAddr, fmtUsd, fmtEth } from "@/lib/format";
import { FollowButton } from "./FollowButton";

async function getData() {
  const me = await getCurrentUser();
  const followingIds = (
    await prisma.follow.findMany({
      where: { followerId: me.id },
      select: { followingId: true },
    })
  ).map((f) => f.followingId);

  const suggestions = await prisma.user.findMany({
    where: { id: { notIn: [me.id, ...followingIds] } },
    take: 3,
    orderBy: { portfolioValue: "desc" },
  });

  const trending = await prisma.post.findMany({
    where: { type: "LISTING" },
    orderBy: { likes: "desc" },
    take: 3,
    select: {
      id: true,
      address: true,
      tokenSymbol: true,
      yieldAPY: true,
      tokensSold: true,
      tokenSupply: true,
    },
  });

  return { suggestions, trending };
}

export async function RightPanel() {
  const { suggestions, trending } = await getData();

  // Mocked market data — styled like a Bloomberg terminal.
  const market = [
    { sym: "ETH", price: 3401.22, chg: +1.84 },
    { sym: "BTC", price: 68_204.50, chg: -0.42 },
    { sym: "STRATA-IDX", price: 124.51, chg: +3.71 },
  ];

  return (
    <aside className="sticky top-[64px] hidden h-[calc(100vh-80px)] w-[320px] shrink-0 flex-col gap-5 overflow-y-auto pr-1 xl:flex">
      {/* Market pulse */}
      <div className="rounded-xl border border-border bg-surface p-4 font-mono text-[12px]">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">
            Market Pulse
          </span>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint shadow-glow-mint" />
        </div>
        {market.map((m) => (
          <div
            key={m.sym}
            className="flex items-center justify-between border-t border-border/60 py-2 first:border-t-0"
          >
            <span className="text-text-primary">{m.sym}</span>
            <span className="text-text-secondary">
              ${m.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </span>
            <span className={m.chg >= 0 ? "text-mint" : "text-error"}>
              {m.chg >= 0 ? "+" : ""}
              {m.chg.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {/* People to follow */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
          People to follow
        </div>
        <div className="flex flex-col gap-3">
          {suggestions.map((u) => (
            <div key={u.id} className="flex items-center gap-3">
              {u.avatar ? (
                <Image
                  src={u.avatar}
                  alt={u.username}
                  width={36}
                  height={36}
                  className="rounded-full ring-1 ring-border"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-surface-2" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">@{u.username}</div>
                <div className="font-mono text-[11px] text-text-secondary">
                  {fmtEth(u.portfolioValue)}
                </div>
              </div>
              <FollowButton userId={u.id} />
            </div>
          ))}
        </div>
      </div>

      {/* Trending properties */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
          Trending Properties
        </div>
        <div className="flex flex-col gap-3">
          {trending.map((p) => {
            const pct = Math.round(((p.tokensSold ?? 0) / (p.tokenSupply || 1)) * 100);
            return (
              <div key={p.id} className="rounded-lg bg-surface-2 p-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-mono text-gold">{p.tokenSymbol}</span>
                  <span className="text-mint">{p.yieldAPY}% APY</span>
                </div>
                <div className="mt-1 truncate text-[12px] text-text-secondary">
                  {p.address}
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full bg-brand-gradient"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] font-mono text-text-secondary">
                  {pct}% subscribed
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-1 text-[11px] text-text-secondary">
        © STRATA · Own the layer beneath.
      </div>
    </aside>
  );
}
