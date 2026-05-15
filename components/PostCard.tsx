"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, createContext, useContext } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, MessageCircle, Repeat2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { fmtEth, fmtUsd, ethToUsd, shortAddr, timeAgo } from "@/lib/format";
import { useEthUsd } from "./PriceProvider";
import type { FeedPost } from "@/lib/types";

const Sparkline = dynamic(() => import("./Sparkline").then((m) => m.Sparkline), {
  ssr: false,
  loading: () => <div className="h-20 px-5" />,
});

const Ctx = createContext<{ post: FeedPost } | null>(null);
function usePost() {
  const v = useContext(Ctx);
  if (!v) throw new Error("PostCard.* must be inside <PostCard>");
  return v.post;
}

export function PostCard({
  post,
  index = 0,
  children,
}: {
  post: FeedPost;
  index?: number;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const accentByType = {
    LISTING: "border-border",
    MARKET: "border-border border-l-4 border-l-brand-violet",
    PORTFOLIO: "border-border bg-gold-tint",
  } as const;

  return (
    <Ctx.Provider value={{ post }}>
      <motion.article
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.32,
          delay: reduce ? 0 : Math.min(index, 8) * 0.06,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cn(
          "overflow-hidden rounded-2xl border bg-surface transition-colors hover:border-border/80",
          accentByType[post.type],
        )}
      >
        {children}
      </motion.article>
    </Ctx.Provider>
  );
}

PostCard.Header = function Header() {
  const post = usePost();
  return (
    <div className="flex items-center gap-3 px-5 pt-4">
      <Link href={`/profile/${post.creator.username}`} className="shrink-0">
        {post.creator.avatar ? (
          <Image
            src={post.creator.avatar}
            alt={post.creator.username}
            width={40}
            height={40}
            className="rounded-full ring-1 ring-border"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-surface-2" />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Link
            href={`/profile/${post.creator.username}`}
            className="truncate text-[14px] font-semibold hover:text-brand-violet"
          >
            @{post.creator.username}
          </Link>
          <span className="text-text-secondary">·</span>
          <span className="font-mono text-[11px] text-text-secondary">
            {shortAddr(post.creator.walletAddress)}
          </span>
          <span className="text-text-secondary">·</span>
          <span className="text-[12px] text-text-secondary">{timeAgo(post.createdAt)}</span>
        </div>
        <TypeBadge type={post.type} />
      </div>
    </div>
  );
};

function TypeBadge({ type }: { type: FeedPost["type"] }) {
  const cfg = {
    LISTING: { label: "Tokenized Property", cls: "border-gold/40 bg-gold/10 text-gold" },
    MARKET: { label: "Market Take", cls: "border-brand-violet/40 bg-brand-violet/10 text-brand-violet" },
    PORTFOLIO: { label: "Portfolio Update", cls: "border-mint/30 bg-mint/10 text-mint" },
  }[type];
  return (
    <span
      className={cn(
        "mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]",
        cfg.cls,
      )}
    >
      {cfg.label}
    </span>
  );
}

PostCard.Body = function Body() {
  const post = usePost();
  return (
    <div className="px-5 pt-3">
      <p className="text-[14.5px] leading-relaxed text-text-primary line-clamp-6">
        {post.content}
      </p>
    </div>
  );
};

PostCard.PropertyBadge = function PropertyBadge() {
  const post = usePost();
  const price = useEthUsd();
  if (post.type !== "LISTING") return null;
  const sold = post.tokensSold ?? 0;
  const supply = post.tokenSupply ?? 1;
  const pct = Math.min(100, Math.round((sold / supply) * 100));
  const isWhale = post.topInvestmentEth >= 10;

  return (
    <div className="mt-3 px-5">
      {post.imageUrl && (
        <div className="relative aspect-video overflow-hidden rounded-xl ring-1 ring-border">
          <Image
            src={post.imageUrl}
            alt={post.address ?? "Property"}
            fill
            sizes="(max-width: 768px) 100vw, 680px"
            className="object-cover transition-transform duration-700 hover:scale-[1.03]"
          />
          <div className="absolute left-3 top-3 rounded-full bg-gold/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-black shadow-lg">
            Tokenized Property
          </div>
          {isWhale && (
            <div className="absolute right-3 top-3 rounded-full border border-mint/40 bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-mint backdrop-blur">
              🐋 Top investor · {fmtEth(post.topInvestmentEth)}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold">
              {post.tokenSymbol}
            </div>
            <div className="mt-0.5 truncate text-[15px] font-semibold">
              {post.address}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[20px] font-semibold leading-none text-mint">
              {post.yieldAPY?.toFixed(1)}% <span className="text-[11px] text-text-secondary">APY</span>
            </div>
            <div className="mt-1 text-[12px] text-text-secondary">
              {fmtEth(post.priceEth ?? 0)} · {fmtUsd(ethToUsd(post.priceEth ?? 0, price))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-text-secondary">
            <span>
              {sold.toLocaleString()} / {supply.toLocaleString()} tokens
            </span>
            <span>{pct}% subscribed</span>
          </div>
          <div
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${pct}% subscribed`}
          >
            <div
              className="h-full bg-brand-gradient transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-[11px] text-text-secondary">
            Min invest {fmtEth(post.minInvest ?? 0)}
          </span>
          <InvestButton postId={post.id} min={post.minInvest ?? 0.05} />
        </div>
      </div>
    </div>
  );
};

function InvestButton({ postId, min }: { postId: string; min: number }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function invest() {
    setBusy(true);
    try {
      const res = await fetch(`/api/invest/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountEth: min }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setDone(true);
      toast.success(`Invested ${fmtEth(min)}`, {
        description: `${data.tokens} tokens · new balance ${data.balance.toFixed(2)} ETH`,
      });
    } catch (e: any) {
      toast.error("Invest failed", { description: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={invest}
      disabled={busy || done}
      className={cn(
        "rounded-full px-4 py-1.5 text-[12px] font-medium transition-all",
        done
          ? "bg-mint/15 text-mint"
          : "bg-brand-gradient text-white shadow-glow hover:-translate-y-px disabled:opacity-60",
      )}
    >
      {done ? "Invested ✓" : busy ? "Investing…" : `Invest ${fmtEth(min)}`}
    </button>
  );
}

PostCard.Chart = function Chart() {
  const post = usePost();
  if (!post.chartData) return null;
  return <Sparkline data={post.chartData} />;
};

PostCard.Actions = function Actions() {
  const post = usePost();
  const [liked, setLiked] = useState(post.likedByMe);
  const [count, setCount] = useState(post.likes);

  async function toggle() {
    const next = !liked;
    setLiked(next); // optimistic
    setCount((c) => c + (next ? 1 : -1));
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
    } catch {
      setLiked(!next);
      setCount((c) => c + (next ? -1 : 1));
      toast.error("Couldn't update like");
    }
  }

  return (
    <div className="mt-3 flex items-center gap-1 border-t border-border/60 px-2 py-1">
      <ActionBtn
        icon={<Heart size={16} className={liked ? "fill-error text-error" : ""} />}
        label={String(count)}
        onClick={toggle}
        ariaPressed={liked}
      />
      <ActionBtn icon={<MessageCircle size={16} />} label="" />
      <ActionBtn icon={<Repeat2 size={16} />} label="" />
      <ActionBtn icon={<Share2 size={16} />} label="" />
    </div>
  );
};

function ActionBtn({
  icon,
  label,
  onClick,
  ariaPressed,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  ariaPressed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ariaPressed}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}
