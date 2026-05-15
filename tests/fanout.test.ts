import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the prisma module before importing fanout.
const state: {
  follows: Array<{ followerId: string; followingId: string }>;
  feeds: Map<string, string[]>;
} = { follows: [], feeds: new Map() };

vi.mock("@/lib/prisma", () => ({
  prisma: {
    follow: {
      findMany: vi.fn(async ({ where, skip = 0, take = 100 }: any) => {
        const matches = state.follows.filter(
          (f) => f.followingId === where.followingId,
        );
        return matches.slice(skip, skip + take).map((f) => ({
          followerId: f.followerId,
        }));
      }),
    },
    feed: {
      findUnique: vi.fn(async ({ where }: any) => {
        const ids = state.feeds.get(where.userId);
        return ids ? { userId: where.userId, postIds: JSON.stringify(ids) } : null;
      }),
      upsert: vi.fn(async ({ where, update, create }: any) => {
        const next = JSON.parse(update.postIds ?? create.postIds);
        state.feeds.set(where.userId, next);
        return { userId: where.userId, postIds: update.postIds ?? create.postIds };
      }),
    },
  },
}));

import { enqueueFanOut, subscribeFeedUpdates } from "@/lib/fanout";

beforeEach(() => {
  state.follows = [];
  state.feeds = new Map();
});

function wait(ms = 30) {
  return new Promise((r) => setTimeout(r, ms));
}

describe("Fan-Out worker", () => {
  it("prepends a new postId to every follower's feed", async () => {
    state.follows = [
      { followerId: "u1", followingId: "creator" },
      { followerId: "u2", followingId: "creator" },
      { followerId: "u3", followingId: "creator" },
    ];
    enqueueFanOut({ postId: "post-A", creatorId: "creator" });
    await wait(50);

    expect(state.feeds.get("creator")?.[0]).toBe("post-A");
    expect(state.feeds.get("u1")?.[0]).toBe("post-A");
    expect(state.feeds.get("u2")?.[0]).toBe("post-A");
    expect(state.feeds.get("u3")?.[0]).toBe("post-A");
  });

  it("caps the feed at 500 entries", async () => {
    const old = Array.from({ length: 500 }, (_, i) => `old-${i}`);
    state.feeds.set("u1", old);
    state.follows = [{ followerId: "u1", followingId: "c" }];

    enqueueFanOut({ postId: "new-post", creatorId: "c" });
    await wait(50);

    const feed = state.feeds.get("u1")!;
    expect(feed.length).toBe(500);
    expect(feed[0]).toBe("new-post");
    expect(feed.includes("old-499")).toBe(false); // dropped off the end
  });

  it("deduplicates if the same postId reappears", async () => {
    state.feeds.set("u1", ["existing", "post-A"]);
    state.follows = [{ followerId: "u1", followingId: "c" }];
    enqueueFanOut({ postId: "post-A", creatorId: "c" });
    await wait(50);

    const feed = state.feeds.get("u1")!;
    expect(feed[0]).toBe("post-A");
    expect(feed.filter((id) => id === "post-A").length).toBe(1);
  });

  it("emits a feed:update event to subscribers", async () => {
    state.follows = [];
    const seen: string[] = [];
    const unsub = subscribeFeedUpdates((id) => seen.push(id));
    enqueueFanOut({ postId: "post-Z", creatorId: "c" });
    await wait(50);
    unsub();
    expect(seen).toContain("post-Z");
  });
});
