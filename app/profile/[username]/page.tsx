import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getEthUsd } from "@/lib/eth-price";
import { fmtEth, fmtUsd, ethToUsd, shortAddr, timeAgo } from "@/lib/format";
import { FollowButton } from "@/components/FollowButton";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const user = await prisma.user.findUnique({ where: { username: params.username } });
  if (!user) return { title: "Not found · STRATA" };
  return {
    title: `@${user.username} · ${fmtEth(user.portfolioValue)} portfolio · STRATA`,
    description: user.bio ?? `Tokenized real estate portfolio of @${user.username} on STRATA.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      _count: { select: { posts: true, followers: true, following: true } },
      holdings: true,
      posts: { orderBy: { createdAt: "desc" } },
      investments: {
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { post: { select: { tokenSymbol: true, address: true } } },
      },
    },
  });
  if (!user) notFound();
  const [me, price] = await Promise.all([getCurrentUser(), getEthUsd()]);
  const isMe = me.id === user.id;
  const isFollowing = isMe
    ? false
    : !!(await prisma.follow.findUnique({
        where: {
          followerId_followingId: { followerId: me.id, followingId: user.id },
        },
      }));

  return (
    <div className="max-w-[680px] pb-16">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border">
        <div className="relative h-44 w-full bg-brand-gradient">
          <div
            aria-hidden
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=300&fit=crop&q=80)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              mixBlendMode: "luminosity",
            }}
          />
        </div>
        <div className="bg-surface px-6 pb-5 pt-0">
          <div className="-mt-12 flex items-end justify-between gap-4">
            <div className="relative">
              <div className="gradient-ring rounded-full p-[2px]">
                <div className="rounded-full bg-surface p-[3px]">
                  {user.avatar && (
                    <Image
                      src={user.avatar}
                      alt={user.username}
                      width={96}
                      height={96}
                      className="rounded-full"
                    />
                  )}
                </div>
              </div>
            </div>
            {!isMe && <FollowButton userId={user.id} initial={isFollowing} />}
          </div>
          <h1 className="mt-3 text-[22px] font-semibold">@{user.username}</h1>
          <div className="mt-1 font-mono text-[12px] text-text-secondary">
            {shortAddr(user.walletAddress)}
          </div>
          {user.bio && (
            <p className="mt-3 text-[14px] text-text-secondary">{user.bio}</p>
          )}
          <div className="mt-4 grid grid-cols-4 gap-3 rounded-xl border border-border bg-surface-2 p-3">
            <Stat label="Posts" value={user._count.posts} />
            <Stat label="Followers" value={user._count.followers} />
            <Stat label="Following" value={user._count.following} />
            <Stat label="Portfolio" value={fmtEth(user.portfolioValue)} />
          </div>
        </div>
      </div>

      {/* Holdings */}
      <section className="mt-6">
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
          Holdings
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-text-secondary">
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Entry</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3 text-right">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {user.holdings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                    No holdings yet.
                  </td>
                </tr>
              )}
              {user.holdings.map((h) => {
                const drift = 1 + Math.sin(h.id.charCodeAt(0)) * 0.1 + 0.05;
                const current = h.entryPrice * drift;
                const gain = (drift - 1) * 100;
                const value = h.tokens * current;
                return (
                  <tr key={h.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-mono text-gold">{h.tokenSymbol}</td>
                    <td className="px-4 py-3">{h.tokens}</td>
                    <td className="px-4 py-3">{h.entryPrice.toFixed(5)} ETH</td>
                    <td className="px-4 py-3">{fmtUsd(ethToUsd(value, price))}</td>
                    <td
                      className={
                        "px-4 py-3 text-right font-mono " +
                        (gain >= 0 ? "text-mint" : "text-error")
                      }
                    >
                      {gain >= 0 ? "+" : ""}
                      {gain.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Activity */}
      <section className="mt-6">
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
          Activity
        </h2>
        <ul className="overflow-hidden rounded-2xl border border-border bg-surface">
          {user.investments.length === 0 && (
            <li className="px-4 py-8 text-center text-text-secondary">No activity yet.</li>
          )}
          {user.investments.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between border-b border-border/60 px-4 py-3 last:border-0"
            >
              <div>
                <div className="text-[13px]">
                  Invested in{" "}
                  <span className="font-mono text-gold">{i.post.tokenSymbol}</span>
                </div>
                <div className="text-[11px] text-text-secondary">
                  {i.post.address} · {timeAgo(i.createdAt)} ago
                </div>
              </div>
              <div className="font-mono text-[13px]">{fmtEth(i.amountEth)}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-text-secondary">
        {label}
      </div>
      <div className="mt-1 text-[15px] font-semibold">{value}</div>
    </div>
  );
}
