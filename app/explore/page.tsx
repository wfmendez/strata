import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/PostCard";
import type { FeedPost } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Explore Tokenized Properties · STRATA",
  description: "All tokenized real estate listings on STRATA, ranked by recency.",
};

export default async function ExplorePage() {
  const posts = await prisma.post.findMany({
    where: { type: "LISTING" },
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, username: true, avatar: true, walletAddress: true } },
      investments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { amountEth: true, createdAt: true },
      },
    },
  });

  const serial = posts.map((p: any) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    investments: p.investments?.map((i: any) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
    })),
  })) as FeedPost[];

  return (
    <div className="max-w-[680px] pb-16">
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold">Explore</h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          Every tokenized listing on STRATA. Ranked by recency.
        </p>
      </header>
      <div className="flex flex-col gap-4">
        {serial.map((post, i) => (
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
    </div>
  );
}
