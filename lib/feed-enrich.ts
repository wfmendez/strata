import { prisma } from "@/lib/prisma";

// Attach `likedByMe` and `topInvestmentEth` to a batch of posts in 2 queries.
export async function enrichPostsForUser<T extends { id: string }>(
  posts: T[],
  userId: string,
) {
  if (posts.length === 0) return [];
  const ids = posts.map((p) => p.id);

  const [likes, agg] = await Promise.all([
    prisma.like.findMany({
      where: { userId, postId: { in: ids } },
      select: { postId: true },
    }),
    // SQLite-friendly: group max(amountEth) per postId
    prisma.investment.groupBy({
      by: ["postId"],
      where: { postId: { in: ids } },
      _max: { amountEth: true },
    }),
  ]);

  const likedSet = new Set(likes.map((l) => l.postId));
  const topByPost = new Map(agg.map((a) => [a.postId, a._max.amountEth ?? 0]));

  return posts.map((p: any) => ({
    ...p,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    likedByMe: likedSet.has(p.id),
    topInvestmentEth: topByPost.get(p.id) ?? 0,
  }));
}
