import { prisma } from "@/lib/prisma";

// In-memory fan-out (simulates BullMQ). For a real deploy, swap the
// `enqueueFanOut` body for `queue.add('fanout', { postId })` and run a worker.
type Job = { postId: string; creatorId: string };
const queue: Job[] = [];
let processing = false;

const FEED_CAP = 500;
const BATCH = 100;

export function enqueueFanOut(job: Job) {
  queue.push(job);
  void processNext();
}

async function processNext() {
  if (processing) return;
  processing = true;
  try {
    while (queue.length) {
      const job = queue.shift()!;
      await fanOutOne(job);
    }
  } finally {
    processing = false;
  }
}

async function fanOutOne({ postId, creatorId }: Job) {
  // Creator's own feed always sees their post.
  await prependToFeed(creatorId, postId);

  // Page followers in batches of 100 (Fan-Out on Write pattern).
  let skip = 0;
  while (true) {
    const batch = await prisma.follow.findMany({
      where: { followingId: creatorId },
      select: { followerId: true },
      skip,
      take: BATCH,
    });
    if (batch.length === 0) break;
    await Promise.all(batch.map((f) => prependToFeed(f.followerId, postId)));
    if (batch.length < BATCH) break;
    skip += BATCH;
  }

  // Notify SSE listeners
  emitFeedUpdate(postId);
}

async function prependToFeed(userId: string, postId: string) {
  const existing = await prisma.feed.findUnique({ where: { userId } });
  const current: string[] = existing ? JSON.parse(existing.postIds) : [];
  const next = [postId, ...current.filter((id) => id !== postId)].slice(
    0,
    FEED_CAP,
  );
  await prisma.feed.upsert({
    where: { userId },
    update: { postIds: JSON.stringify(next) },
    create: { userId, postIds: JSON.stringify(next) },
  });
}

// --- SSE pub/sub (in-memory) ---
type Listener = (postId: string) => void;
const listeners = new Set<Listener>();

export function subscribeFeedUpdates(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function emitFeedUpdate(postId: string) {
  for (const l of listeners) l(postId);
}
