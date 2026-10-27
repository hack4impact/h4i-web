# Hack4Impact — Volunteer Platform

Internal operations platform for managing chapters, projects, volunteers, and partners across the Hack4Impact network.

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

**3. Set up the auth database**

```bash
pnpm prisma migrate dev --name init
```

**4. Seed an admin user (optional)**

```bash
pnpm tsx prisma/seed.ts
```

Default credentials: `admin@hack4impact.org` / `password`

**5. Start the operations-api**

Follow setup instructions in the operations-api repo. It must be running before starting this app so that roles can be resolved on sign-in.

**6. Run the development server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

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
├── schema.prisma               # Auth-only schema
└── seed.ts                     # Dev seed data
```
