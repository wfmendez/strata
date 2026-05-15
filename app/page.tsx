import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { enrichPostsForUser } from "@/lib/feed-enrich";
import { FeedList } from "@/components/FeedList";
import type { FeedPost } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getInitialFeed(): Promise<FeedPost[]> {
  const me = await getCurrentUser();
  const feed = await prisma.feed.findUnique({ where: { userId: me.id } });
  const ids: string[] = feed ? JSON.parse(feed.postIds) : [];
  const slice = ids.slice(0, 20);

  const posts = await prisma.post.findMany({
    where: { id: { in: slice } },
    include: {
      creator: { select: { id: true, username: true, avatar: true, walletAddress: true } },
    },
  });
  const byId = new Map(posts.map((p) => [p.id, p]));
  const ordered = slice.map((id) => byId.get(id)).filter(Boolean) as typeof posts;
  const enriched = await enrichPostsForUser(ordered, me.id);
  return enriched as FeedPost[];
}

export default async function FeedPage() {
  const posts = await getInitialFeed();
  return (
    <div className="max-w-[680px]">
      <FeedList initialPosts={posts} />
    </div>
  );
}
