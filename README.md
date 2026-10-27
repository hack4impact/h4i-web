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

## Project Directory

The sidebar opens `/projects`, a responsive project card grid protected by the existing auth proxy. Combine chapter, stage, project length, and impact area dropdown filters; remove individual filter chips or clear all filters. The grid includes pagination (nine cards per page), loading skeletons, retryable errors, and empty states. Cards open a full detail page with tagline, badges, partner and timeline, goal narrative, team, solution, demo photos/videos, and resource links. Empty optional sections are hidden. Team avatars use initials until member avatar fields are available. Edit forms are a future milestone.

Authenticated read routes are `GET /api/projects` (published projects) and `GET /api/projects/:projectId` (published detail; admins and the creating Project Lead can also retrieve drafts). Both return JSON 401 responses when signed out. Draft detail visibility is shared by the API and rendered page: members and unrelated leads receive a 404, while admins and the creating Project Lead may view drafts. Ownership uses the authenticated user ID or verified email matched to the local creator record. Chapter-wide lead access awaits the planned chapter/permissions integration. Create, update, publish, and delete are later milestones.

`src/lib/projects/client.ts` provides typed browser methods `projectsClient.list()` and `projectsClient.get(id)`, using same-origin session cookies. The response includes team members and resource links, and selects only user IDs and names.

### List API

`GET /api/projects` accepts `q` (trimmed, case-insensitive substring search, maximum 200 characters), `chapter_id`, `stage` (`design`, `development`, `launched`, `maintenance`), `project_length` (`short`, `medium`, `long`, `ongoing`), `impact_area`, `page` (default 1), and `page_size` (default 9, maximum 100). All filters combine with AND and always exclude drafts, including for admins. Invalid filter values return 400. Pages beyond the last page clamp to the last available page.

Project length uses calendar months between start and end dates: `short` is under three months, `medium` is three through six months inclusive, `long` is over six months, and `ongoing` has no end date. Missing start dates do not match finite duration buckets. Duration filters do not infer lifecycle stage.

The list response is now an object: `{ projects, pagination: { page, pageSize, total, totalPages }, filters: { chapters, impactAreas } }`. Filter choices come from all published projects, so they remain available when a combination has no matches. Chapter names resolve through the existing Notion directory when configured, with seeded chapter labels and ID fallbacks when unavailable. Media-free or broken-image cards show a placeholder.

Example: `/api/projects?chapter_id=seed-chapter-chicago&stage=development&project_length=ongoing&impact_area=Volunteer%20Ops&page_size=3`.

With a running development server and the standard seed data, run `npm run test:projects` for the authenticated API integration checks. Set `PROJECT_TEST_URL` to override `http://127.0.0.1:3000`. These checks read the seed fixtures and do not modify project records.

### Search and detail

The search field debounces for 300 ms and searches project names, taglines, partner names, goal/solution narratives, technology/impact tags, and chapter display names. SQL wildcard characters are treated as literal text. Free text combines with every selected filter. Chapter-name autocomplete supports keyboard navigation (Arrow keys, Enter, Escape) and mouse selection; choosing a suggestion adds a chapter chip and clears the text search. Search chips can be removed independently, and Clear Filters clears both query and filters. Superseded list requests are cancelled so old results cannot replace a newer search.

The detail page and JSON endpoint share `src/lib/projects/detail.ts` for authorization. Resource links allow only HTTP(S); media also permits local asset paths. Invalid links are hidden, broken media has a fallback, and external resources open in a new tab. Dates render in UTC to avoid shifting stored date-only timeline values.

The read-only member-to-detail flow is implemented. The leadership demo and final filter UI decision are still pending; use [the demo walkthrough](docs/project-directory-demo.md) to run the review. No final leadership preference is assumed.

`npm run test:projects` also checks search, combined filters, literal wildcard handling, and API/page draft visibility with signed local test sessions for members, owners, unrelated leads, and admins. Those tests load `AUTH_SECRET` from `.env.local` when present or from the environment; they never expose its value.
