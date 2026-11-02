# Platform decisions

Short record of the cross-cutting decisions every feature branch builds on.
Change one of these in a PR that updates this file, not in a feature PR.

Last updated: 2026-10-31 (foundations PR).

## 1. `develop` is the integration branch

- All feature branches fork from and target `develop`. `main` is release only.
- Rebase onto `develop` before requesting review. CI must be green to merge.
- Changes to `prisma/schema.prisma` and `src/lib/auth/**` need a TL review.

## 2. One `Role` enum

`NATIONAL_ADMIN`, `CHAPTER_LEAD`, `PROJECT_LEAD`, `MEMBER` (from the IMA auth
spec). Role and chapter are cached on `User` until the ops-api exposes
`GET /volunteers?email=` and `GET /volunteers/:id/roles`.

Mapping from names used on earlier branches:

| Earlier name         | Now              |
| -------------------- | ---------------- |
| `ADMIN`, `NATIONALS` | `NATIONAL_ADMIN` |
| `CHAPTER_LEADER`     | `CHAPTER_LEAD`   |
| `VOLUNTEER`, Member  | `MEMBER`         |
| `COD`                | not a role yet   |

`COD` is deferred until the directory PRD states what it may do. Do not add a
role whose permissions are unspecified. Directory positions (PM, TL,
DEVELOPER, DESIGNER, BUSINESS) are a separate enum owned by the directory
feature, not roles.

Use the allow-lists and helpers in `src/lib/auth/roles.ts`
(`EDITOR_ROLES`, `ADMIN_ROLES`, `canActForChapter`) rather than comparing
role strings at call sites.

## 3. One `Chapter` table

`Chapter { id, name (unique), region? }` lives in this database and is seeded
from `prisma/seed/chapters.ts` with stable ids (`chapter-cornell`, ...).
Every chapter-scoped model (`Member`, `Alumni`, `SourcedProject`,
`ProjectClaim`, `Project`) references `Chapter.id` with a real foreign key.
`User.chapterId` is the user's home chapter.

## 4. Domain data lives in this app's Postgres this semester

The original plan kept domain data in the operations-api. All three features
store their data here, so that is now the documented architecture. Revisit
the ops-api split next semester.

## 5. Auth is the custom session system

Cookie `sessionToken` holds a random 32-byte `Session.id`. Password login and
magic links both create sessions. NextAuth is removed.

- Pages and layouts: `requireSession()` / `requireRole()` from
  `src/lib/auth/guards.ts` (redirects).
- Server actions and route handlers: `assertSession()` / `assertRole()`
  (throws), or `getSessionFromRequest(request)` when you have a `Request`.
- `session.user` is the full `User` row, so `role` and `chapterId` are on it.
- `src/proxy.ts` only checks that a cookie exists. It is never the only check.

## 6. API style

Server actions and Next route handlers by default. The Sourced Project
Exchange keeps its GraphQL endpoint at `/api/graphql` as a contained
exception; its context must resolve the viewer through `getCurrentSession()`.

## 7. Migrations

- No production data exists. History is `20260414045530_init` plus
  `20261031120000_platform_foundations`, then exactly one migration per
  feature, generated against `develop`.
- `pnpm db:deploy` and `pnpm db:seed` refuse non-local hosts unless
  `ALLOW_REMOTE_DEPLOY` / `ALLOW_REMOTE_SEED` is set. Railway sets the former.
- Never `prisma db push` on a shared database. Never add a migration that
  patches an earlier unmerged draft; amend the draft instead.
- Hand-written SQL (partial unique indexes, triggers) is allowed inside a
  migration when Prisma cannot express it. Say so in a comment.

## 8. Seeds and tests

- `prisma/seed.ts` orchestrates one module per feature in `prisma/seed/`.
  Modules are idempotent (upsert by stable id or email). The seed refuses
  non-localhost databases unless `ALLOW_REMOTE_SEED=true`.
- Unit tests: `*.test.ts`, run by `pnpm test`, no database.
- Integration tests: `*.int.test.ts`, run by `pnpm test:int` against the
  seeded local database, serially. CI runs both.

## 9. Known security gaps (decide before any real users)

- **Sign-up is open.** Per the auth spec, a magic link for an unknown address
  creates a `MEMBER` account on first use. Anyone who can receive email can
  therefore read everything members can (directory, exchange listings). Options:
  invite-only (Nationals creates users first), an allow-list of chapter domains,
  or ops-api membership lookup at sign-in. Until decided, do not deploy with
  real member data.
- **No rate limiting** on `/api/auth/login` or `/api/auth/magic-link`. The
  latter sends mail to arbitrary addresses on request.
- Sessions last 30 days with no rotation or sliding expiry; logout revokes
  only the current device.

## Open questions (owner: TL/PMs)

- What `COD` is and what it may do.
- Whether admins may edit another person's directory profile.
- Project archive: multi-chapter leads, whether Leads can delete, freeform
  vs. controlled tags.
- Legacy member data: matching new sign-ups to existing Member/Alumni rows.
