import { prisma } from "@/lib/prisma";

// Mock auth — first user (alessandro) is the "current user" for the demo.
// Swap for SIWE / NextAuth in production.
export async function getCurrentUser() {
  const user = await prisma.user.findUnique({ where: { username: "alessandro" } });
  if (!user) throw new Error("Seed the database: pnpm db:seed");
  return user;
}
