import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { enrichPostsForUser } from "@/lib/feed-enrich";
import { ExploreList } from "@/components/ExploreList";
import type { FeedPost } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Explore Tokenized Properties · STRATA",
  description: "All tokenized real estate listings on STRATA, ranked by recency.",
};

export default async function ExplorePage() {
  const me = await getCurrentUser();
  const raw = await prisma.post.findMany({
    where: { type: "LISTING" },
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, username: true, avatar: true, walletAddress: true } },
    },
  });
  const serial = (await enrichPostsForUser(raw, me.id)) as FeedPost[];

  return (
    <div className="max-w-[680px] pb-16">
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold">Explore</h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          Every tokenized listing on STRATA. Filter by city, token, or author.
        </p>
      </header>
      <ExploreList posts={serial} />
    </div>
  );
}
