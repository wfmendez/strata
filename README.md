<div align="center">
  <img src="public/logo.svg" width="56" alt="STRATA"/>

  # STRATA

  **Own the layer beneath.**

  A premium SocialFi platform where real estate investors post tokenized
  property deals, follow each other, and earn DeFi yield.

  ![Next.js](https://img.shields.io/badge/Next.js-14-000?logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)
  ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss)
  ![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)
  ![Zustand](https://img.shields.io/badge/Zustand-state-FF6F00)
</div>

---

## Architecture

```mermaid
flowchart LR
  Client[Next.js Client<br/>React Server Components]
  API[Next.js API Routes<br/>Server Actions]
  DB[(SQLite / Postgres<br/>via Prisma)]
  Queue[Fan-Out Worker<br/>in-memory BullMQ-style]
  SSE[SSE pub/sub]

  Client -->|fetch /api/*| API
  API --> DB
  API -->|new Post| Queue
  Queue -->|prepend postId| DB
  Queue --> SSE
  SSE --> Client
```

**Feed = Fan-Out on Write.** Each user has one `Feed` row holding a
JSON-array of postIds (capped at 500). On `POST /api/posts`, the
worker pages followers in batches of 100 and prepends the new postId
to each follower's feed. Reads are a single indexed lookup.

## Tech stack

- **Next.js 14** App Router · TypeScript strict · Server Components by default
- **Tailwind CSS** with CSS-variable brand tokens · custom dark theme
- **Prisma** + SQLite locally (PostgreSQL-ready — swap the `provider`)
- **Zustand** for wallet / UI state
- **Recharts** for yield sparklines · **Framer Motion** for entrance + modal motion
- **shadcn/ui-style** primitives written by hand (no extra dep cost)

## Getting started

You need a PostgreSQL URL. Two easy paths:

- **Neon** (free, recommended) — sign up, create a project, copy the
  pooled + direct connection strings.
- **Local Docker**: `docker run -d --name strata-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16`

Then:

```bash
cp .env.example .env             # paste your Postgres URLs + a generated SESSION_SECRET
pnpm install                     # runs `prisma generate` via postinstall
pnpm exec prisma migrate deploy  # applies prisma/migrations
pnpm db:seed                     # 5 users, 15 posts, 11 follows
pnpm dev                         # http://localhost:3000
```

Reset DB: `pnpm db:reset` · Run tests: `pnpm test`

## Deploy to Vercel

1. Push the repo to GitHub (already done).
2. In Vercel, **Add New → Project → Import** `wfmendez/strata`.
3. Open the project → **Storage → Create Database → Postgres**.
   This provisions a Neon DB and auto-injects `DATABASE_URL` + `DIRECT_URL`.
4. **Settings → Environment Variables**:
   - `SESSION_SECRET` — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
   - `ALLOW_DEMO_AUTH` — `0` for prod
5. **Redeploy.** The build runs `prisma migrate deploy && next build` so the
   schema lands automatically on the Neon DB.
6. Seed once: open Vercel Storage → SQL → paste the contents of
   [prisma/seed.sql](prisma/seed.sql) (or run `DATABASE_URL=<prod-url> pnpm db:seed` from your laptop).

## Auth

Two paths:
- **SIWE (real wallets)** — Sign-In with Ethereum. Nonce → personal_sign →
  signature verified server-side with `viem.verifyMessage` → httpOnly
  session cookie. Auto-provisions a user on first sign-in.
- **Demo switcher** — pick any seeded user from the header dropdown.
  Disable in production with `ALLOW_DEMO_AUTH=0`.

The session is read in every server route via `lib/session.ts`.

## API

| Method   | Endpoint                    | Purpose                                 |
| -------- | --------------------------- | --------------------------------------- |
| `GET`    | `/api/feed`                 | Paginated feed (`?cursor`, `?pageSize`, `?filter`) |
| `POST`   | `/api/posts`                | Create post + enqueue Fan-Out worker    |
| `PUT`    | `/api/follow/:userId`       | Follow user (idempotent)                |
| `DELETE` | `/api/follow/:userId`       | Unfollow                                |
| `GET`    | `/api/users/:username`      | Profile + counts + holdings             |
| `POST`   | `/api/invest/:postId`       | Mock invest (decrements ETH, mints tokens) |
| `GET`    | `/api/portfolio`            | Current user's holdings + activity      |
| `POST`   | `/api/posts/:id/like`       | Toggle like (persists in `Like` table)  |
| `GET`    | `/api/posts/:id`            | Single post with `likedByMe` enrichment |
| `GET`    | `/api/feed/events`          | SSE stream — emits new post IDs to subscribers |
| `POST`   | `/api/upload`               | Multipart image upload (≤ 5 MB)         |
| `GET`    | `/api/auth/nonce`           | SIWE nonce + cookie                     |
| `POST`   | `/api/auth/verify`          | SIWE signature verify + set session     |
| `POST`   | `/api/auth/demo`            | Demo sign-in by username                |
| `POST`   | `/api/auth/logout`          | Clear session cookie                    |
| `GET`    | `/api/auth/me`              | Current session user                    |

## Project shape

```
app/
  layout.tsx              Brand-locked shell · sticky header · JSON-LD
  page.tsx                Feed (RSC) → <FeedList> (client, infinite scroll)
  explore/page.tsx        All LISTING posts
  portfolio/page.tsx      Holdings table + activity
  profile/[username]/     Hero + stats + holdings + activity
  api/                    REST endpoints (all `force-dynamic`)
components/
  PostCard.tsx            Compound component: .Header .Body .PropertyBadge .Chart .Actions
  Sidebar.tsx             Nav · wallet card · "New Post" CTA
  RightPanel.tsx          Market pulse · suggestions · trending properties
  Composer.tsx            3-step modal (type → form → preview)
  WalletPanel.tsx         Slide-in drawer with txn history
  Logo.tsx                SVG mark — 4 stacked slabs, hover-staggered animation
lib/
  fanout.ts               In-memory queue + SSE pub/sub
  prisma.ts               Global PrismaClient
  stores.ts               Zustand: wallet, UI
  format.ts               ETH/USD formatters
prisma/
  schema.prisma           User · Post · Follow · Feed · Investment · Holding
  seed.ts                 5 users · 15 posts · 11 follows · 15 investments
```

## Design

- **Background** `#070B14` with a fixed SVG-noise overlay + radial brand glows
- **Brand gradient** `#6366F1 → #A855F7 → #EC4899` — used on CTAs, logo, accents
- **Gold** `#D4AF37` for tokenized-property motifs
- **Mint** `#00FFB3` for yield / on-chain success
- **Card surfaces** `#0E1422` / `#141B2D` · borders `#1E2A42`
- Animated gradient avatar rings on profile pages
- Staggered entrance fade-up on every PostCard (Framer Motion)
- Logo layers shift up 2px on hover, staggered by 40ms

## Security model

**Session cookies are HMAC-signed.** [lib/crypto.ts](lib/crypto.ts) signs `{ sub, iat, exp }` with HMAC-SHA256 using `SESSION_SECRET` (≥ 32 chars in prod). [lib/session.ts](lib/session.ts) verifies in constant time and rejects tampered or expired tokens. The cookie is `httpOnly`, `SameSite=Lax`, and `Secure` in production. The nonce cookie is signed the same way and has a 10-minute freshness window.

**SIWE messages are fully validated.** [lib/siwe.ts](lib/siwe.ts) parses every field (`domain`, `address`, `uri`, `nonce`, `Issued At`) and `validateSiweMessage` rejects replays from other sites (`domain` / `uri` mismatch), stale messages (> 5 min old), wrong nonce, or malformed addresses — *before* the signature is verified by viem. The nonce is cleared after every verify attempt, success or failure.

**CSRF defense.** [middleware.ts](middleware.ts) blocks any `POST`/`PUT`/`PATCH`/`DELETE` whose `Origin` header doesn't match the request `Host`. Combined with `SameSite=Lax`, this closes the gap that lets `fetch()` from a malicious site trigger state changes.

**CSP and security headers.** The middleware sets:
- `Content-Security-Policy` restricting `img-src` to known image hosts + uploads, `connect-src` to self + CoinGecko, `frame-ancestors 'none'`, `form-action 'self'`
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera/mic/geo

**Rate limits** (in-memory, per-IP or per-user) on every state-changing or expensive endpoint. See [lib/rate-limit.ts](lib/rate-limit.ts). Swap for `@upstash/ratelimit` in serverless.

**Uploads are validated by magic bytes**, not by the client-supplied `Content-Type`. [lib/image-sniff.ts](lib/image-sniff.ts) checks the first bytes against JPEG/PNG/GIF/WEBP signatures and rejects everything else — including SVG (which can embed scripts) and HTML disguised with an image mime type. Filenames are random, set server-side.

**Image hosts are allowlisted.** `POST /api/posts` rejects any `imageUrl` outside `/uploads/`, Unsplash, pravatar, or picsum — preventing posts from pointing at attacker-controlled origins.

**Env vars:** see [.env.example](.env.example). `SESSION_SECRET` is required in production; `ALLOW_DEMO_AUTH=0` disables the demo user picker.

## Production notes

This is a portfolio reference, but the path to production is concrete:

- **Database**: swap `provider = "sqlite"` → `"postgresql"` in `prisma/schema.prisma`,
  set `DATABASE_URL` to a Neon/Supabase Postgres URL, run `prisma migrate deploy`.
- **Fan-Out queue**: `lib/fanout.ts` is in-memory and resets per cold start.
  For real deploys use Redis + BullMQ (or Upstash QStash / Vercel Queues) with
  a separate worker process. The job shape (`{ postId, creatorId }`) and the
  prepend-with-dedup-and-cap algorithm don't change.
- **SSE**: `/api/feed/events` works on Node runtime but Vercel serverless
  cuts streams at 30s. Either run on a node-server target or move to
  WebSockets / Ably / Pusher for multi-instance deploys.
- **Image storage**: `POST /api/upload` writes to `public/uploads/` — fine
  for local. Swap for Vercel Blob / S3 in production (≤ 10 LoC change).
- **Env vars**: `DATABASE_URL`, `ALLOW_DEMO_AUTH=0` to disable demo sign-in.
- **CSP**: add a `Content-Security-Policy` header restricting img sources to
  Unsplash / pravatar / your uploads CDN.

## Roadmap

- Real chain integration (SIWE auth · wagmi · viem · WalletConnect)
- Chainlink price feeds for live ETH/USD and yield oracle
- ERC-1400 / RealT-style property token standard with on-chain dividends
- Governance token (`$STRT`) with weighted voting on platform listings
- Native mobile (Expo) sharing the same feed Fan-Out API
- Background SSE feed updates → real-time PostCard insertion

---

<sub>Built as a portfolio-grade reference for SocialFi UX. © STRATA.</sub>
