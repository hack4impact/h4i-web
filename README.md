# Hack4Impact — Volunteer Platform

Internal platform (the National IMA) for Hack4Impact chapters: a member and alumni directory, a Sourced Project Exchange for passing vetted nonprofit projects between chapters, and Notion-backed pages for chapters, projects, volunteers and partners.

## What's in the app

| Area                                     | Pages / API                                          | Data                                                         |
| ---------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| Sign-in                                  | `/sign-in`, `/api/auth/*`                            | Postgres (`User`, `Session`, `MagicLinkToken`)               |
| Member & alumni directory                | `/members`, `/admin/directory-audit`                 | Postgres (`Member`, `Alumni`, …)                             |
| Sourced Project Exchange                 | `/api/graphql` (no UI yet)                           | Postgres (`SourcedProject`, `ProjectClaim`, …)               |
| Chapters, projects, volunteers, partners | `/chapters`, `/projects`, `/volunteers`, `/partners` | Notion, read-only. The create and edit pages don't save yet. |

Built with Next.js 16 (App Router), Prisma 7 on PostgreSQL, Tailwind and GraphQL Yoga.

## Setup

You need Node.js 22, pnpm 10 and Docker.

```bash
pnpm install
cp .env.local.example .env.local
pnpm db:up        # Postgres in Docker on localhost:5432
pnpm db:deploy    # apply migrations
pnpm db:seed      # chapters, users, Sourced Project Exchange data
pnpm dev          # http://localhost:3000
```

Optional: `ALLOW_DIRECTORY_SEED=true pnpm db:seed:directory` adds about 60 member and alumni profiles so `/members` has something to show.

### Environment variables

| Variable         | Needed for                                                                              |
| ---------------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | Everything. The example value matches `docker-compose.yml`.                             |
| `PUBLIC_URL`     | Links in magic-link emails (`http://localhost:3000` locally)                            |
| `PLUNK_API_KEY`  | Sending magic-link emails. Leave empty locally: the link is printed in the dev console. |
| `NOTION_API_KEY` | The Notion-backed pages. Without it they load but show no rows.                         |

`db:seed` and `db:deploy` refuse to run against a non-local database unless `ALLOW_REMOTE_SEED` / `ALLOW_REMOTE_DEPLOY` is `"true"`.

### Seed accounts

Every account's password is `password`.

| Email                                                                | Role             | Chapter                    |
| -------------------------------------------------------------------- | ---------------- | -------------------------- |
| `admin@hack4impact.org`                                              | `NATIONAL_ADMIN` | none                       |
| `lead@hack4impact.org`, `lead.uiuc@…`, `lead.berkeley@…`             | `CHAPTER_LEAD`   | Cornell, UIUC, UC Berkeley |
| `lead.gt@hack4impact.org`, `lead.bu@hack4impact.org`                 | `CHAPTER_LEAD`   | GT, BU                     |
| `projectlead@hack4impact.org`                                        | `PROJECT_LEAD`   | Cornell                    |
| `member@hack4impact.org`, `volunteer.uiuc@…`, `volunteer.berkeley@…` | `MEMBER`         | Cornell, UIUC, UC Berkeley |

Re-running the seed is safe. If your local database is older than the current migrations, run `pnpm db:reset` (it wipes the database, re-applies migrations and re-seeds).

## Auth and roles

- **Sign-in** is by email and password, or by a one-time magic link. The first magic-link sign-in for a new email creates a `MEMBER` account.
- **Sessions** are rows in the `Session` table. The `sessionToken` cookie holds the session id and lasts 30 days.
- **`src/proxy.ts`** sends anyone without a session cookie to `/sign-in`. It runs on the Edge and only checks that the cookie exists, so every page and action must also check the session itself.

Use these instead of reading cookies yourself:

| Where                                   | Use                                                 |
| --------------------------------------- | --------------------------------------------------- |
| Pages and layouts                       | `requireSession()`, `requireRole(roles)` (redirect) |
| Server actions and route handlers       | `assertSession()`, `assertRole(roles)` (throw)      |
| Route handlers that receive a `Request` | `getSessionFromRequest(request)`                    |

All of these are in `src/lib/auth/`.

**Roles** are `NATIONAL_ADMIN`, `CHAPTER_LEAD`, `PROJECT_LEAD` and `MEMBER`. Check them with the lists and helpers in `src/lib/auth/roles.ts` rather than comparing strings:

| Helper                              | Who                                                     |
| ----------------------------------- | ------------------------------------------------------- |
| `ADMIN_ROLES`                       | `NATIONAL_ADMIN`                                        |
| `CHAPTER_LEADERSHIP_ROLES`          | `NATIONAL_ADMIN`, `CHAPTER_LEAD`                        |
| `EDITOR_ROLES`                      | `NATIONAL_ADMIN`, `CHAPTER_LEAD`, `PROJECT_LEAD`        |
| `DIRECTORY_ADMIN_ROLES`             | `NATIONAL_ADMIN` (directory moderation)                 |
| `canActForChapter(user, chapterId)` | Nationals for any chapter, a chapter lead for their own |

Each user has one home chapter (`User.chapterId`, null for Nationals). There is a single `Chapter` table; link to it by foreign key.

## Database

- Schema: `prisma/schema.prisma`. Migrations: `prisma/migrations/`.
- To change the schema, edit `schema.prisma` on an up-to-date `develop` and run `pnpm db:migrate --name <change>`. Never add a new baseline or `init` migration.
- Some rules live only in migration SQL because Prisma can't express them: the one-active-claim index on `project_claim`, and the trigger that clears directory opt-in when a profile changes owner. Apply schema changes through migrations, never `prisma db push`.
- Seed data is one file per feature in `prisma/seed/`, with fixed ids so it can be re-run. Shared users are in `prisma/seed/users.ts`.

## Member & alumni directory

`Member` and `Alumni` are separate profile tables. A profile shows up in the directory only when it has an owner, is approved, is opted in, and isn't hidden by an admin (`src/lib/directory/visibility.ts`).

- `/members` searches visible members and alumni, with filters kept in the URL.
- Admin actions are server actions in `src/actions/directory-admin.ts`: approve, reject, manual create, claim tokens, member-to-alumni transition and role changes. Each one writes to `AdminAuditLog`, viewable at `/admin/directory-audit`.
- A person claims an admin-created profile with a one-time token. Claiming never opts them in; they consent separately.
- `pnpm db:verify:directory-workflows` runs these flows end to end against a local `volunteer_platform*` database and cleans up after itself.

## Sourced Project Exchange API

Listings are served over GraphQL at `/api/graphql` (GraphiQL is enabled outside production). Requests use the session cookie; unauthenticated requests get an `UNAUTHENTICATED` error.

- `listings(first, after, filter, search)` returns paginated, non-withdrawn listings from every chapter, newest first. `filter` narrows by `status`, `causeArea`, and `sourcingChapterId`; `search` does a case-insensitive match on title, description, and scope.
- `listing(id)` returns one listing.
- `createListing(input)`, `updateListing(id, input)`, and `withdrawListing(id)` are limited to leads of the sourcing chapter and admins (`FORBIDDEN` otherwise). Input is validated with zod (`src/lib/sourced-projects/listing-input.ts`); failures return `BAD_USER_INPUT` with per-field `issues`. Withdrawing sets `withdrawnAt`, and listings are never hard-deleted.

Client contact fields and partner notes are exposed under `contact`. For anyone who isn't a `CHAPTER_LEAD` or `NATIONAL_ADMIN`, they are never selected from the database and `contact` is `null` (see `src/lib/sourced-projects/contact-gating.ts`).

### Claims

Every claim status change goes through `src/lib/sourced-projects/claims.ts`, which also sets the matching listing status. Nothing else writes either.

| Mutation        | Who                       | Claim                    | Listing                       |
| --------------- | ------------------------- | ------------------------ | ----------------------------- |
| `requestClaim`  | Lead of another chapter   | → `PENDING`              | `AVAILABLE` → `CLAIM_PENDING` |
| `approveClaim`  | Sourcing chapter or admin | `PENDING` → `APPROVED`   | → `CLAIMED`                   |
| `rejectClaim`   | Sourcing chapter or admin | `PENDING` → `REJECTED`   | → `AVAILABLE`                 |
| `withdrawClaim` | Claiming chapter or admin | `PENDING` → `WITHDRAWN`  | → `AVAILABLE`                 |
| `abandonClaim`  | Either chapter or admin   | `APPROVED` → `ABANDONED` | → `AVAILABLE`                 |

- A transition that no longer applies (for example, approving a claim that was just rejected) returns `CONFLICT`. When two chapters claim the same listing at once, one gets `CONFLICT`. The one-active-claim index in the migration is a second guard.
- Pending claims expire after 14 days (`CLAIM_TIMEOUT_DAYS`) and the listing returns to `AVAILABLE`. Schedule `pnpm claims:expire` to run daily. A stale claim is also expired when another chapter requests the same listing.
- Withdrawing a listing rejects its pending claim. A listing with an approved claim can't be withdrawn until the claim is abandoned.
- New claims emit `claimRequested` on `claimEvents` (`src/lib/sourced-projects/claim-events.ts`) for notifications to subscribe to.

## Tests and checks

```bash
pnpm test        # unit tests: *.test.ts, no database
pnpm test:int    # integration tests: *.int.test.ts, against DATABASE_URL
pnpm typecheck
pnpm lint
```

Integration tests expect a migrated and seeded database (`pnpm db:deploy && pnpm db:seed`). Name a test `*.int.test.ts` if it touches the database, otherwise `*.test.ts`.

CI (`.github/workflows/ci.yml`) runs on every PR into `develop` or `main`: typecheck, lint, unit tests and build, then migrations, a check that `schema.prisma` matches the migrations, the seed, and integration tests against a fresh Postgres.

## Scripts

| Script                               | Does                                                        |
| ------------------------------------ | ----------------------------------------------------------- |
| `pnpm dev` / `build` / `start`       | Next.js dev server, production build, production server     |
| `pnpm db:up`                         | Start local Postgres (`docker compose up -d`)               |
| `pnpm db:migrate`                    | Create and apply a new migration (`prisma migrate dev`)     |
| `pnpm db:deploy`                     | Apply pending migrations (local only unless allowed)        |
| `pnpm db:seed`                       | Seed chapters, users and Sourced Project Exchange data      |
| `pnpm db:seed:directory`             | Seed directory profiles (needs `ALLOW_DIRECTORY_SEED=true`) |
| `pnpm db:reset`                      | Wipe the local database, re-migrate and re-seed             |
| `pnpm db:verify:directory-workflows` | End-to-end check of the directory admin flows               |
| `pnpm claims:expire`                 | Expire pending claims older than 14 days                    |
| `pnpm format` / `lint:fix`           | Prettier and ESLint fixes                                   |

## Project structure

```
src/
├── app/
│   ├── (auth)/sign-in/             # Sign-in page (password or magic link)
│   ├── (protected)/                # Signed-in app shell with sidebar
│   │   ├── dashboard/  settings/
│   │   ├── (directory)/            # members, chapters, projects, volunteers, partners
│   │   └── admin/directory-audit/  # Directory audit log (admins)
│   └── api/
│       ├── auth/                   # login, logout, magic-link, magic-link/verify
│       └── graphql/                # Sourced Project Exchange API
├── actions/                        # Server actions
├── components/                     # layout/ (Sidebar) and ui/ primitives
├── lib/
│   ├── auth/                       # sessions, cookies, guards, roles, passwords
│   ├── directory/                  # directory search, visibility, admin workflows
│   ├── graphql/                    # GraphQL schema and handler
│   ├── sourced-projects/           # listings, claims, contact gating
│   ├── notion/                     # Notion client and readers
│   ├── validators/                 # zod schemas
│   └── db.ts                       # Prisma client
├── proxy.ts                        # Redirects signed-out visitors to /sign-in
└── types/
prisma/
├── schema.prisma
├── migrations/
├── seed.ts  seed/                  # dev seed, one file per feature
└── seed-directory.ts  verify-*.ts  # directory seed and checks
scripts/expire-claims.ts
```

## Contributing

Branch off `develop` and open PRs into `develop`, not `main`. CI must pass before merging.
