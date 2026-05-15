"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PostCard } from "./PostCard";
import type { FeedPost } from "@/lib/types";

export function ExploreList({ posts }: { posts: FeedPost[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return posts;
    return posts.filter((p) =>
      [p.address, p.tokenSymbol, p.content, p.creator.username]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(needle)),
    );
  }, [posts, q]);

  return (
    <>
      <div className="mb-5 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 focus-within:border-brand-violet/60">
        <Search size={16} className="text-text-secondary" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by city, token symbol, or @user…"
          className="flex-1 bg-transparent text-[14px] placeholder:text-text-secondary focus:outline-none"
          aria-label="Search listings"
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
          {filtered.length} / {posts.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center text-text-secondary">
          No matches. Try a city, token symbol, or @user.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((post, i) => (
            <PostCard key={post.id} post={post} index={i}>
              <PostCard.Header />
              <PostCard.Body />
              <PostCard.PropertyBadge />
              <div className="px-3 pb-2">
                <PostCard.Actions />
              </div>
            </PostCard>
          ))}
        </div>
      )}
    </>
  );
}
