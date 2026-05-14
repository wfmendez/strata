"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUI } from "@/lib/stores";
import { PostCard } from "./PostCard";
import type { FeedPost } from "@/lib/types";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "LISTING", label: "Listings" },
  { key: "MARKET", label: "Markets" },
  { key: "PORTFOLIO", label: "Portfolio" },
] as const;

export function FeedList({ initialPosts }: { initialPosts: FeedPost[] }) {
  const { feedFilter, setFilter } = useUI();
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [cursor, setCursor] = useState(initialPosts.length);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 20);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  // Reset when filter changes
  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ cursor: "0", pageSize: "20" });
    if (feedFilter !== "ALL") params.set("filter", feedFilter);
    fetch(`/api/feed?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setPosts(d.posts);
        setCursor(d.nextCursor);
        setHasMore(d.hasMore);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [feedFilter]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const params = new URLSearchParams({
      cursor: String(cursor),
      pageSize: "20",
    });
    if (feedFilter !== "ALL") params.set("filter", feedFilter);
    const data = await fetch(`/api/feed?${params}`).then((r) => r.json());
    setPosts((p) => [...p, ...data.posts]);
    setCursor(data.nextCursor);
    setHasMore(data.hasMore);
    setLoading(false);
  }, [cursor, feedFilter, hasMore, loading]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <>
      <div className="sticky top-[60px] z-20 -mx-2 mb-4 flex items-center gap-1 rounded-2xl border border-border bg-bg/80 px-2 py-1.5 backdrop-blur">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={
              "rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors " +
              (feedFilter === f.key
                ? "bg-surface text-text-primary"
                : "text-text-secondary hover:text-text-primary")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {posts.length === 0 && !loading && <EmptyState />}

      <div className="flex flex-col gap-4">
        {posts.map((post, i) => (
          <PostCard key={post.id} post={post} index={i}>
            <PostCard.Header />
            <PostCard.Body />
            {post.type === "LISTING" && <PostCard.PropertyBadge />}
            {post.type === "MARKET" && post.chartData && <PostCard.Chart />}
            <div className="px-3 pb-2">
              <PostCard.Actions />
            </div>
          </PostCard>
        ))}
      </div>

      {loading && <SkeletonList />}
      <div ref={sentinel} className="h-8" />
      {!hasMore && posts.length > 0 && (
        <p className="my-8 text-center text-[11px] uppercase tracking-[0.18em] text-text-secondary">
          End of feed
        </p>
      )}
    </>
  );
}

function SkeletonList() {
  return (
    <div className="mt-4 flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-32 rounded" />
              <div className="skeleton h-2 w-20 rounded" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-11/12 rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-14 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-gradient" />
      <h3 className="mt-4 text-[16px] font-semibold">The layer is empty.</h3>
      <p className="mt-1 text-[13px] text-text-secondary">
        Be the first to post a deal, a take, or a portfolio move.
      </p>
    </div>
  );
}
