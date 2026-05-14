export type FeedPost = {
  id: string;
  type: "LISTING" | "MARKET" | "PORTFOLIO";
  content: string;
  createdAt: string;
  imageUrl: string | null;
  address: string | null;
  priceEth: number | null;
  yieldAPY: number | null;
  tokenSymbol: string | null;
  tokenSupply: number | null;
  tokensSold: number | null;
  minInvest: number | null;
  chartData: string | null;
  likes: number;
  creator: {
    id: string;
    username: string;
    avatar: string | null;
    walletAddress: string;
  };
  investments?: { amountEth: number; createdAt: string }[];
};
