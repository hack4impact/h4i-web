# Hack for Impact — Volunteer Platform

Internal operations platform for managing chapters, projects, volunteers, and partners across the Hack for Impact network.

## Architecture

This Next.js app uses Auth.js for authentication. Existing chapter, partner, and volunteer directories read from Notion. Project Directory records live in this app's PostgreSQL database alongside users.

Chapter and partner IDs on projects reference external directory records; they are not local foreign keys. Development seeds use three clearly prefixed chapter fixture IDs, rather than creating canonical chapters. Team membership references local users. Connecting the member selector to the canonical Volunteer Directory is a later milestone.

## Setup

Requires Node.js 22.6+ (for the TypeScript seed runner), pnpm, and PostgreSQL.
Set `DATABASE_URL` to the PostgreSQL connection string and `AUTH_SECRET` to a random secret. Existing Notion directories also need the environment variables listed in `src/lib/notion/client.ts`.

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The development sign-in is currently `admin@hack4impact.org` / `password`, implemented in the existing auth provider. Seeding also creates a matching local user; it does not change authentication.

The repeatable development seed loads 15 projects with three chapter fixture IDs, all four lifecycle stages, three drafts, twelve published records, and team/resource rows. It updates only its own project fixture IDs and should be used on development databases.

Migrations include an auth baseline because the repository previously had no migration history. For an existing database that already contains the original `User` table and `Role` enum, baseline it **before** applying the project migration:

```bash
pnpm prisma migrate resolve --applied 20261006000100_auth_baseline
pnpm db:migrate
```

## Project Directory foundations

The sidebar opens `/projects`, an empty page protected by the existing auth proxy. Existing new/detail/edit page stubs remain available for future milestones.

Authenticated read routes are `GET /api/projects` (published projects) and `GET /api/projects/:projectId` (published detail; admins can also retrieve drafts). Both return JSON 401 responses when signed out. Draft access for chapter leads awaits chapter claims in auth; drafts are hidden from non-admin detail requests for now. Create, update, publish, delete, filtering, and the directory dashboard are later milestones.

`src/lib/projects/client.ts` provides typed browser methods `projectsClient.list()` and `projectsClient.get(id)`, using same-origin session cookies. The response includes team members and resource links, and selects only user IDs and names.
