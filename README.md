# Hack for Impact — Volunteer Platform

Internal operations platform for managing chapters, projects, volunteers, and partners across the Hack for Impact network.

## Architecture

This app is the **frontend + auth layer**. Domain data (chapters, projects, volunteers, partners) lives in the **operations-api** — a separate GraphQL/REST service. This app stores only auth state (users, sessions, OAuth accounts) in its own database.

```
volunteer-platform (this repo)
  ├── Auth database (PostgreSQL) — users, sessions, OAuth accounts
  └── operations-api             — all domain data via GraphQL
```

User roles (`ADMIN`, `CHAPTER_LEADER`, `VOLUNTEER`) are resolved at sign-in by querying the operations-api for the user's active officer assignments. They are cached in the JWT and refreshed on session update.

## Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database (auth only)
- [operations-api](../operations-api) running locally

## Setup

**1. Install dependencies**

```bash
pnpm install
```

**2. Configure environment variables**

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable             | Description                                                       |
| -------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string for the auth database                |
| `AUTH_SECRET`        | Random secret — run `openssl rand -base64 32`                     |
| `AUTH_URL`           | App base URL (default: `http://localhost:3000`)                   |
| `AUTH_GOOGLE_ID`     | Google OAuth client ID                                            |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret                                        |
| `OPERATIONS_API_URL` | Base URL of the operations-api (default: `http://localhost:3001`) |

**3. Start Postgres and apply migrations**

```bash
docker compose up -d
pnpm prisma migrate deploy
```

The one-active-claim rule for the Sourced Project Exchange is a partial unique index written by hand in `prisma/migrations/*_sourced_project_exchange`. Prisma can't express it in `schema.prisma`, so always apply schema changes through migrations, never `prisma db push`.

**4. Seed dev data**

```bash
pnpm prisma db seed
```

This creates 4 chapters, 15 Sourced Project Exchange listings with claims and links, and these accounts. All of them use the password `password`:

| Email                                                    | Role             | Chapter     |
| -------------------------------------------------------- | ---------------- | ----------- |
| `admin@hack4impact.org`                                  | `ADMIN`          | none        |
| `lead.uiuc@hack4impact.org`                              | `CHAPTER_LEADER` | UIUC        |
| `lead.berkeley@hack4impact.org`                          | `CHAPTER_LEADER` | UC Berkeley |
| `lead.gt@hack4impact.org`, `lead.bu@hack4impact.org`     | `CHAPTER_LEADER` | GT, BU      |
| `volunteer.uiuc@hack4impact.org`, `volunteer.berkeley@…` | `VOLUNTEER`      | UIUC, UCB   |

Re-running the seed is safe; it upserts by fixed ids.

**5. Start the operations-api**

Follow setup instructions in the operations-api repo. It must be running before starting this app so that roles can be resolved on sign-in.

**6. Run the development server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Sourced Project Exchange API

Listings are served over GraphQL at `/api/graphql` (GraphiQL is enabled outside production). Requests use the Auth.js session cookie; unauthenticated requests get an `UNAUTHENTICATED` error.

- `listings(first, after, filter, search)` returns paginated, non-withdrawn listings from every chapter, newest first. `filter` narrows by `status`, `causeArea`, and `sourcingChapterId`; `search` does a case-insensitive match on title, description, and scope.
- `listing(id)` returns one listing.
- `createListing(input)`, `updateListing(id, input)`, and `withdrawListing(id)` are limited to chapter leaders of the sourcing chapter and admins (`FORBIDDEN` otherwise). Input is validated with zod (`src/lib/sourced-projects/listing-input.ts`); failures return `BAD_USER_INPUT` with per-field `issues`. Withdrawing sets `withdrawnAt`, and listings are never hard-deleted.

Client contact fields and partner notes are exposed under `contact`. For anyone who isn't a `CHAPTER_LEADER` or `ADMIN`, they are never selected from the database and `contact` is `null` (see `src/lib/sourced-projects/contact-gating.ts`).

### Claims

Every claim status change goes through `src/lib/sourced-projects/claims.ts`, which also sets the matching listing status. Nothing else writes either.

| Mutation        | Who                       | Claim                    | Listing                       |
| --------------- | ------------------------- | ------------------------ | ----------------------------- |
| `requestClaim`  | Leader of another chapter | → `PENDING`              | `AVAILABLE` → `CLAIM_PENDING` |
| `approveClaim`  | Sourcing chapter or admin | `PENDING` → `APPROVED`   | → `CLAIMED`                   |
| `rejectClaim`   | Sourcing chapter or admin | `PENDING` → `REJECTED`   | → `AVAILABLE`                 |
| `withdrawClaim` | Claiming chapter or admin | `PENDING` → `WITHDRAWN`  | → `AVAILABLE`                 |
| `abandonClaim`  | Either chapter or admin   | `APPROVED` → `ABANDONED` | → `AVAILABLE`                 |

- A transition that no longer applies (for example, approving a claim that was just rejected) returns `CONFLICT`. When two chapters claim the same listing at once, one gets `CONFLICT`. The one-active-claim index in the migration is a second guard.
- Pending claims expire after 14 days (`CLAIM_TIMEOUT_DAYS`) and the listing returns to `AVAILABLE`. Schedule `pnpm claims:expire` to run daily. A stale claim is also expired when another chapter requests the same listing.
- Withdrawing a listing rejects its pending claim. A listing with an approved claim can't be withdrawn until the claim is abandoned.
- New claims emit `claimRequested` on `claimEvents` (`src/lib/sourced-projects/claim-events.ts`) for notifications to subscribe to.

## Tests

```bash
pnpm test
```

The API tests run against the seeded dev database, so run `docker compose up -d` and `pnpm prisma db seed` first.

## Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create an OAuth 2.0 client (Web application)
3. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI
4. Copy the client ID and secret into `.env.local`

## Refreshing a user's role

If a user's officer assignment changes, their role in the JWT will be stale until they sign out and back in. To force an immediate refresh, call `update()` from the client after making the assignment change:

```ts
import { useSession } from "next-auth/react";

const { update } = useSession();
await update(); // re-triggers jwt callback with trigger === "update"
```

## Project structure

```
src/
├── app/
│   ├── (auth)/sign-in/         # Public sign-in page
│   ├── (dashboard)/            # Protected app shell (sidebar + topbar)
│   │   ├── dashboard/
│   │   ├── chapters/
│   │   ├── projects/
│   │   ├── volunteers/
│   │   └── partners/
│   └── api/auth/[...nextauth]/ # Auth.js API route
├── actions/                    # Next.js Server Actions
├── components/
│   ├── layout/                 # Sidebar, TopBar
│   └── ui/                     # Shared UI primitives
├── lib/
│   ├── auth.ts                 # Auth.js config
│   ├── db.ts                   # Prisma client
│   └── operations-api.ts       # GraphQL client for operations-api
├── middleware.ts                # Route protection
└── types/                      # Shared TypeScript types
prisma/
├── schema.prisma               # Auth + Sourced Project Exchange schema
├── migrations/
└── seed.ts                     # Dev seed data
```
