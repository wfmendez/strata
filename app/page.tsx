import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
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
      investments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { amountEth: true, createdAt: true },
      },
    },
  });
  const byId = new Map(posts.map((p) => [p.id, p]));
  return slice
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((p: any) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      investments: p.investments?.map((i: any) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
      })),
    })) as FeedPost[];
}

export default async function FeedPage() {
  const posts = await getInitialFeed();
  return (
    <div className="max-w-[680px]">
      <FeedList initialPosts={posts} />
    </div>
  );
}
