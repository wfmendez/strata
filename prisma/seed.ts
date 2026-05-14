import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PostType = { LISTING: "LISTING", MARKET: "MARKET", PORTFOLIO: "PORTFOLIO" } as const;

async function main() {
  // Wipe in dependency order
  await prisma.investment.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.feed.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const users = await Promise.all(
    [
      {
        username: "alessandro",
        walletAddress: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
        bio: "Founder @ STRATA. Tokenizing the layer beneath.",
        avatar: "https://i.pravatar.cc/200?img=12",
        portfolioValue: 47.3,
        ethBalance: 12.4,
      },
      {
        username: "gabi",
        walletAddress: "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f",
        bio: "DeFi yields, real assets. Italy → on-chain.",
        avatar: "https://i.pravatar.cc/200?img=47",
        portfolioValue: 12.8,
        ethBalance: 3.1,
      },
      {
        username: "fernando",
        walletAddress: "0x9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b",
        bio: "Sourcing yield in LATAM. Property + protocol.",
        avatar: "https://i.pravatar.cc/200?img=33",
        portfolioValue: 8.5,
        ethBalance: 1.8,
      },
      {
        username: "mayachen",
        walletAddress: "0x3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f",
        bio: "🐋 Whale. Long real estate, longer cryptography.",
        avatar: "https://i.pravatar.cc/200?img=5",
        portfolioValue: 93.1,
        ethBalance: 48.2,
      },
      {
        username: "jamesvolta",
        walletAddress: "0x7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3a4b5c6d",
        bio: "Builder. Skeptic. Buying NYC class-B at a discount.",
        avatar: "https://i.pravatar.cc/200?img=68",
        portfolioValue: 31.4,
        ethBalance: 9.7,
      },
    ].map((u) => prisma.user.create({ data: u })),
  );

  const [alessandro, gabi, fernando, maya, james] = users;

  // LISTINGS
  const listing1 = await prisma.post.create({
    data: {
      type: PostType.LISTING,
      creatorId: alessandro.id,
      content:
        "Fully renovated mixed-use building in the Garment District. Long-term tenants, 92% occupancy. Yield is conservatively underwritten.",
      address: "247 W 38th St, New York",
      priceEth: 4.2,
      yieldAPY: 8.3,
      tokenSymbol: "PROP-NYC-001",
      tokenSupply: 1000,
      tokensSold: 612,
      minInvest: 0.05,
      imageUrl: "https://picsum.photos/seed/strata-nyc/1200/720",
      likes: 84,
    },
  });

  const listing2 = await prisma.post.create({
    data: {
      type: PostType.LISTING,
      creatorId: maya.id,
      content:
        "Brickell tower unit, short-term rental zoning. High-velocity cash flow, professionally managed.",
      address: "1100 Brickell Ave, Miami",
      priceEth: 2.8,
      yieldAPY: 11.7,
      tokenSymbol: "PROP-MIA-002",
      tokenSupply: 500,
      tokensSold: 318,
      minInvest: 0.1,
      imageUrl: "https://picsum.photos/seed/strata-mia/1200/720",
      likes: 142,
    },
  });

  const listing3 = await prisma.post.create({
    data: {
      type: PostType.LISTING,
      creatorId: james.id,
      content:
        "Class-A office on Congress Ave. Recession-resilient anchor tenants, 7-year WALT.",
      address: "600 Congress Ave, Austin",
      priceEth: 1.5,
      yieldAPY: 9.1,
      tokenSymbol: "PROP-AUS-003",
      tokenSupply: 750,
      tokensSold: 201,
      minInvest: 0.05,
      imageUrl: "https://picsum.photos/seed/strata-aus/1200/720",
      likes: 51,
    },
  });

  // MARKET posts (8)
  const marketSeeds = [
    {
      creatorId: gabi.id,
      content:
        "Yields on tokenized commercial RE are mispriced. The market hasn't caught up to short-term-rental cash flow on-chain.",
      chartData: JSON.stringify([
        { t: 1, v: 7.2 },
        { t: 2, v: 7.8 },
        { t: 3, v: 8.4 },
        { t: 4, v: 9.1 },
        { t: 5, v: 11.7 },
      ]),
    },
    {
      creatorId: maya.id,
      content:
        "Just deployed another 8 ETH into PROP-MIA-002. Brickell occupancy is going to surprise people this quarter.",
    },
    {
      creatorId: fernando.id,
      content:
        "Hot take: SocialFi only works when the social signal correlates with on-chain capital. Followers ≠ alpha. Allocations = alpha.",
    },
    {
      creatorId: alessandro.id,
      content:
        "Watching cap rates compress on tokenized properties in tier-1 cities. Tier-2 is where the asymmetry is.",
    },
    {
      creatorId: james.id,
      content:
        "Austin commercial is the sleeper trade of 2026. Everyone gave up on it. Fundamentals didn't.",
    },
    {
      creatorId: gabi.id,
      content:
        "PSA: read the rent roll before you ape. APY without occupancy data is just a sticker.",
    },
    {
      creatorId: maya.id,
      content:
        "If your tokenized building has a 30-day liquidity window, that's a feature, not a bug.",
      chartData: JSON.stringify([
        { t: 1, v: 9.4 },
        { t: 2, v: 9.7 },
        { t: 3, v: 10.1 },
        { t: 4, v: 10.5 },
        { t: 5, v: 11.2 },
      ]),
    },
    {
      creatorId: fernando.id,
      content:
        "Tokenized RE replaces the middleman, not the underwriter. Don't forget that.",
    },
  ];
  for (const m of marketSeeds) {
    await prisma.post.create({
      data: { ...m, type: PostType.MARKET, likes: Math.floor(Math.random() * 80) + 4 },
    });
  }

  // PORTFOLIO updates (4)
  const portfolioSeeds = [
    {
      creatorId: maya.id,
      content:
        "Q1 update: rotated 12 ETH out of PROP-NYC-001 into PROP-MIA-002. Brickell yield premium is too clean to ignore.",
    },
    {
      creatorId: james.id,
      content:
        "Adding to PROP-AUS-003. My portfolio is now 41% Austin commercial — concentrated, but I know this market cold.",
    },
    {
      creatorId: gabi.id,
      content:
        "Rebalanced: 60% real-estate tokens / 30% blue-chip DeFi / 10% stables. Calm enough to sleep through a 20% drawdown.",
    },
    {
      creatorId: alessandro.id,
      content:
        "First STRATA listing fully subscribed in 72 hours. Thank you to everyone who bought in.",
    },
  ];
  for (const p of portfolioSeeds) {
    await prisma.post.create({
      data: { ...p, type: PostType.PORTFOLIO, likes: Math.floor(Math.random() * 60) + 6 },
    });
  }

  // Follow graph
  const follows: Array<[string, string]> = [
    [gabi.id, alessandro.id],
    [gabi.id, maya.id],
    [fernando.id, alessandro.id],
    [fernando.id, gabi.id],
    [fernando.id, james.id],
    [maya.id, alessandro.id],
    [maya.id, james.id],
    [james.id, alessandro.id],
    [james.id, maya.id],
    [alessandro.id, maya.id],
    [alessandro.id, gabi.id],
  ];
  for (const [followerId, followingId] of follows) {
    await prisma.follow.create({ data: { followerId, followingId } });
  }

  // Investments (15)
  const allPosts = await prisma.post.findMany({
    where: { type: PostType.LISTING },
  });
  const investors = [alessandro, gabi, fernando, maya, james];
  for (let i = 0; i < 15; i++) {
    const post = allPosts[i % allPosts.length];
    const investor = investors[i % investors.length];
    if (post.creatorId === investor.id) continue;
    const amountEth = +(Math.random() * 12 + 0.1).toFixed(2);
    const tokens = Math.max(1, Math.floor(amountEth / (post.minInvest ?? 0.05)));
    await prisma.investment.create({
      data: { userId: investor.id, postId: post.id, amountEth, tokens },
    });
    await prisma.holding.upsert({
      where: {
        userId_tokenSymbol: { userId: investor.id, tokenSymbol: post.tokenSymbol! },
      },
      update: { tokens: { increment: tokens } },
      create: {
        userId: investor.id,
        tokenSymbol: post.tokenSymbol!,
        tokens,
        entryPrice: post.priceEth! / (post.tokenSupply ?? 1000),
      },
    });
  }

  // Initialize empty Feed rows; runtime will fan-out new posts.
  // For instant-on UX we also pre-warm each user's feed with all posts (newest first).
  const allCreated = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const postIds = allCreated.map((p) => p.id);
  for (const u of users) {
    await prisma.feed.create({
      data: { userId: u.id, postIds: JSON.stringify(postIds.slice(0, 500)) },
    });
  }

  console.log(
    `Seeded ${users.length} users · ${allCreated.length} posts · ${follows.length} follows`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
