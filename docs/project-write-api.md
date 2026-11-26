# Project permissions and write APIs (Ticket 4)

This branch uses database-backed `Session` records and the roles `MEMBER`, `PROJECT_LEAD`, `CHAPTER_LEAD`, and `NATIONAL_ADMIN`. Earlier project schema/API work is absent on this branch, so this change adds the required project tables in a new migration against the current User/Chapter models. It does not replace the branch's existing Notion directory UI.

## Setup

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

The seed provides real chapter IDs and test accounts. Every seed account uses password `password`: `admin@hack4impact.org`, `projectlead@hack4impact.org`, `lead@hack4impact.org`, `lead.uiuc@hack4impact.org`, and `member@hack4impact.org`.

## Permissions

| Action                    | Member | Project/Chapter Lead, own chapter | Lead, another chapter | National Admin |
| ------------------------- | ------ | --------------------------------- | --------------------- | -------------- |
| Browse published projects | Yes    | Yes                               | Yes                   | Yes            |
| Read published detail     | Yes    | Yes                               | Yes                   | Yes            |
| Read draft detail         | No     | Yes                               | No                    | Yes            |
| Create draft              | No     | Yes                               | No                    | Yes            |
| Edit / autosave           | No     | Yes                               | No                    | Yes            |
| Publish                   | No     | Yes                               | No                    | Yes            |
| Delete                    | No     | No                                | No                    | Yes            |

A lead can manage **any** project in their chapter, not only projects they created. An unassigned lead cannot create or edit. The session lookup reads the user's current role/chapter from the database on each request. The existing shared chapter-administration guard is unchanged: these are project-specific permissions.

Lead deletion is still an open PRD question; this implementation uses National Admin-only deletion. No client-supplied role, creator, draft flag, publish timestamp, or pending revision may be written.

## Endpoints

The `/projects` API described in the PRD is mounted at `/api/projects` so the existing `/projects` page can remain a page.

- `POST /api/projects`: creates a draft. Requires only `name` for leads; the server assigns their chapter. Supplying another chapter returns **403** (rather than silently ignoring it). Admins must supply a valid `chapterId`. Returns **201**.
- `PATCH /api/projects/:id`: accepts partial fields at every stage, with no publish-required-field checks. Validates formats, references, limits and the merged timeline. Returns **200**. Arrays, when present, replace their entire collection; omit them to preserve existing rows. Use `null` to clear nullable scalar fields and `[]` to clear collections. Blank `name`/narrative/team-role values may be saved but cannot be published when required.
- `POST /api/projects/:id/publish`: validates the full proposed project and returns **422** with `details.missingFields` containing every missing required field. A successful publish atomically sets `isDraft: false`, refreshes `lastUpdated`, and clears pending edits. Repeating publish with no changes preserves the timestamp. Publish accepts no editable body; save edits through PATCH first.
- `DELETE /api/projects/:id`: National Admin only. Returns **204**, removing dependent team/resource rows in the same transaction.
- `GET /api/projects`: supporting read scaffold, returning up to 100 published projects. `?include_drafts=true` additionally returns only drafts the viewer may read. This branch's earlier paginated/filterable dashboard API is not present; restoring that work is separate from this ticket.
- `GET /api/projects/:id`: returns the published view or an authorized draft. Missing projects and drafts outside the viewer's scope return **404**. `?draft=true` lets authorized editors retrieve pending edits to a published project.

All endpoints return **401** without a valid session. Write attempts outside permitted roles/chapters return **403**. Malformed JSON, unknown/server-owned fields, invalid URLs/dates, and nonexistent chapter/team references return **400**. Relation changes racing with a write return **409**. Unknown server errors return a generic **500**. Responses never include user passwords or session tokens.

Inputs accept camelCase and PRD snake_case aliases (`chapter_id`, `problem_statement`, `team_members`, nested `user_id`, etc.). Sending both aliases for one field is rejected. Responses use camelCase. Dates are `YYYY-MM-DD` on input and serialized dates on normal read responses; pending edit views normalize date fields to `YYYY-MM-DD`.

## Stage-dependent publish requirements

The following baseline was confirmed for this ticket:

| Stage       | Required fields                                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Design      | Name, tagline, partner ID **or** partner name, start date, problem statement, goal statement, at least one real team member with a role |
| Development | All Design requirements, solution description, at least one valid resource link                                                         |
| Launched    | Same as Development                                                                                                                     |
| Maintenance | Same as Development                                                                                                                     |

Tags, end date, partner photo, and demo media remain optional at every stage. Tagline is at most 180 characters. URLs must use HTTP(S); media may also use local asset paths. Team rows reference local User records. Partner IDs are external references because no Partner table exists here.

## Draft edits to published projects

Autosaves of a new draft update its fields directly. Autosaves of a published project store `pendingChanges` separately, preserving the live fields, team roster, resource links, and last-published timestamp until validation succeeds. PATCH and authorized `?draft=true` reads return the proposed fields plus `hasUnpublishedChanges`; member reads never expose pending fields. A National Admin can stage chapter reassignment; a lead cannot publish that pending revision into another chapter.

Row locks serialize autosave, publish and delete operations. Nested member/link replacements and publishing occur in database transactions, so a failed validation or foreign-key write does not leave partial changes.

## API example

```bash
curl -c /tmp/project-lead-cookies -H 'Content-Type: application/json' \
  -d '{"email":"projectlead@hack4impact.org","password":"password"}' \
  http://localhost:3000/api/auth/login

curl -b /tmp/project-lead-cookies -H 'Content-Type: application/json' \
  -d '{"name":"Community Project"}' http://localhost:3000/api/projects

# This must return 403: a Cornell lead cannot post to UIUC.
curl -b /tmp/project-lead-cookies -H 'Content-Type: application/json' \
  -d '{"name":"Wrong chapter","chapter_id":"chapter-uiuc"}' \
  http://localhost:3000/api/projects

# Substitute the id returned by create.
curl -b /tmp/project-lead-cookies -X PATCH -H 'Content-Type: application/json' \
  -d '{"stage":"development","tagline":"Partial progress"}' \
  http://localhost:3000/api/projects/PROJECT_ID

# This returns 422 listing all missing fields until the project is complete.
curl -b /tmp/project-lead-cookies -X POST \
  http://localhost:3000/api/projects/PROJECT_ID/publish
```

## Verification

`npm test` covers every Section 14 permissions row for all four platform roles, matching/mismatching/unassigned chapters, stage requirements, incomplete autosaves, input formats and field tampering.

`npm run test:int` calls the actual route handlers with Request objects, database-backed sessions and PostgreSQL. The project test suite refuses non-local databases and requires a database name containing `_test` or `ticket4`. It creates unique fixtures and deletes only those fixtures in cleanup. For example:

```bash
DATABASE_URL=postgresql://postgres:ticket4-local@127.0.0.1:55434/volunteer_ticket4 npm run db:deploy
DATABASE_URL=postgresql://postgres:ticket4-local@127.0.0.1:55434/volunteer_ticket4 npm run test:int
```

Tests cover wrong-chapter 403s, member denial, admin chapter reassignment/deletion, real member references, every publish stage, complete create/edit/publish visibility, revision isolation, role changes on existing sessions, and concurrent autosaves.

## Ticket 5: Add/Edit form

The Project Directory now shows database project records above the existing Notion list. Authorized editors see **Add Project** and **Edit** links. `/projects/new` and `/projects/:id/edit` use `requireRole(EDITOR_ROLES)`; edit pages also enforce chapter scope and load the pending revision with `readProject(..., true)`.

The six sections are Basics, Nonprofit & Timeline, Project Goal, Team Members, Solution, and Resource Links. Stage-required markers use the same `requiredByStage` module as publish validation. Save Draft validates formats and the create minimum (name and permitted chapter), but allows incomplete publish fields at every stage. Publish Changes first saves the fields, then calls the publish endpoint and lists missing requirements. Dates, team rows, resources, tags and media reload on the edit page. Edits to published projects stay private until publishing succeeds.

Chapter options come from the existing Chapter table. Leads see their assigned chapter as a locked dropdown; National Admins may select any chapter. Team selections reference real local User IDs. Display names come from directory profiles the viewer may see, with member-ID labels when a name is unavailable or not shared; private account emails are not exposed by the selector. Partner entry is plain text for this ticket.

Ticket 5 introduced manual draft saving. Ticket 6 adds debounced autosave and searchable member/partner selectors; concurrent-editor conflict resolution remains future work.

### Media uploads

`POST /api/projects/:id/media` accepts a multipart `file` for a scoped editor and returns a media URL. The form creates a minimal draft first if an upload needs a project ID. Uploaded media is linked by Save Draft and becomes visible to members only after successful publication. Selected photos and videos can be previewed and removed from the proposed project.

Uploads support PNG, JPEG, WebP, GIF, MP4 and WebM, up to 20 MB per file and 50 linked media items per project. The endpoint bounds request size, checks file signatures against the declared MIME type, uses generated filenames, and stores files outside `public/`. `GET /api/projects/:id/media/:file` authenticates access, hides draft/unpublished media from members, disables public caching, and supports byte ranges for video playback.

Local files are stored under `.data/project-media` (ignored by Git), or `PROJECT_MEDIA_DIR` when configured. **Deployment requires a persistent writable directory/volume shared by all app instances.** Ephemeral serverless filesystems do not provide durable upload storage. No object storage service is configured. Removing a media item removes its project reference; unreferenced files remain on disk and require separate storage cleanup.

Project APIs now use `assertSession` / `assertRole`, with an optional Request argument for route handlers and integration tests, and the shared role helpers. Existing no-argument server actions keep their previous behavior. Unit tests cover form payloads, dates, URL validation and media signatures. Database tests cover upload authorization, draft privacy, publishing media, byte ranges and invalid uploads.

## Ticket 6: Autosave, publish and directory references

The editor autosaves valid draft snapshots 750 ms after typing stops and shows **Draft saved · Just now** (then an elapsed-minute label). Blank, unused dynamic rows are treated as placeholders. Incomplete publish-required fields do not block autosave; invalid nonempty URLs, unresolved team rows, and missing create minimums pause it with a visible status. Save Draft retries a failed autosave. Requests are serialized, so uploads and autosave share one draft creation, older responses never replace newer typing, and publishing waits for the latest snapshot. A late response from an editor that has been left cannot change another editor's URL.

The first save replaces `/projects/new` with the actual edit URL without clearing the form. Reloading that URL resumes the saved draft or unpublished revision. The form's Back links flush valid pending changes before leaving. Published-project edits remain in `pendingChanges` until publish validation succeeds; public detail and media never expose those changes.

**Publish Changes** saves current edits, displays server errors inline in the matching section with a linked summary, and redirects to `/projects/:id` only after a successful publish. The detail view displays the published partner, timeline, member roster/roles, narratives, media and resources. Empty optional sections are hidden.

The main `/projects` dashboard now requests published records only for every role. **Resume a draft** opens `/projects/drafts`, a separate authenticated editor-only list scoped to the lead's chapter or all chapters for National Admins. API `include_drafts=true` remains an explicit authorized management option; the default list excludes drafts.

### Member references

`GET /api/projects/references/members?q=...` is editor-only and searches real Member Directory profiles. Its query uses `directoryListWhere()` for all roles, including admins, so hidden, unapproved, opted-out and unclaimed profiles never leak through search. Existing selections use `directoryDetailWhere()` and redact inaccessible names. No private account email is returned.

Selecting a member stores both the local User reference and an optional canonical `memberId` foreign key on ProjectTeamMember. The API validates that the Member record belongs to that User and is accessible before accepting a new reference. Legacy User-only team rows continue to work; existing hidden references may be retained without revealing private profile content. Each picker option and selected person has an initials avatar plus an editable project role. Member profiles currently have no photo field, so actual member photos are not invented or copied into project-owned storage.

The migration was generated using `pnpm db:migrate --name project_member_reference`. Apply it and regenerate the client before running this version:

```bash
pnpm db:generate
pnpm db:deploy
pnpm dev
```

The normal auth seed does not create Member Directory profiles. For disposable local demos, the directory-owned fixture script can populate approved, opted-in profiles:

```bash
ALLOW_DIRECTORY_SEED=true pnpm db:seed:directory
```

That script must only be run on a local development database; see its own safety checks. Normal users can create/claim profiles through the Member Directory and complete its approval/consent workflow instead.

### Partner search and display photo

`GET /api/projects/references/partners?q=...` searches the existing Notion-backed Partner Directory and returns only ID, name and optional logo. Set `NOTION_API_KEY` for live results using the existing Partner Directory data source. No canonical Partner records are created or edited. An unavailable or unconfigured directory explicitly offers free-text entry; editing a selected name clears its old directory reference.

A selected ID/name/logo is stored on the draft. Editors can upload, replace or remove a project-local partner photo using `POST /api/projects/:id/media?purpose=partner-photo` (images only). Uploaded partner photos use the same private storage as demo media and remain invisible to members until publication. Deployment still requires durable `PROJECT_MEDIA_DIR` storage.

### Verification

Unit coverage includes draft write ordering, one-time creation shared with uploads, snapshots, recovery after failed writes, empty-row handling, field/section mapping, partner projections and directory unavailability. Database coverage includes canonical Member foreign keys, user/member mismatches, directory visibility, scoped draft-resume lists, and private partner-photo publication.

The end-to-end browser run exercises create → edit → publish for both a Project Lead and a National Admin. It holds the first create response while typing, checks a single draft is created, tests resume and retries, publishes immediately before a debounce fires, verifies the redirect and saved references, and repeats editing/publishing while keeping the live version unchanged. Actual PostgreSQL, auth, project, member-search and upload APIs are used. The Notion boundary is mocked for deterministic partner selection and offline fallback; adapter/route unit tests cover the real directory integration. Live Notion account connectivity is not asserted by this run.

## Ticket 7: Deletion, edge cases and security audit

Deletion is **National Admin only**; the PRD leaves Lead deletion undecided, so Leads cannot delete even their own drafts. Detail and edit pages show an admin-only **Delete Project** button. Its confirmation dialog initially focuses Cancel, supports cancellation without a request, traps focus, and disables dismissal while deleting. Confirmation waits for queued autosaves and suspends further saves, deletes the project, and returns to `/projects`. Temporary errors allow retry; expired/revoked access requires reloading. An already deleted project is treated as a successful removal by the UI.

`DELETE /api/projects/:id` returns 204 on success, 401 without a session, 403 for non-admins, and 404 for a missing project. Team and resource rows cascade in the same database transaction. Project-local media is removed after the commit. Cleanup failures are logged for operational retry; the deleted project's files remain inaccessible through the authenticated media route. Canonical User, Member, Chapter and Partner Directory records are retained.

### Defined edge-case behavior

| Case                                 | Behavior                                                                                                                                                                                                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wrong chapter                        | Both Lead roles are blocked on create, patch, publish, delete, demo upload and partner-photo upload. Foreign draft/edit pages return 404; published detail remains readable. Forging a chapter ID does not grant access.                                                                        |
| Removed Lead role or changed chapter | Each write rereads and locks the current User, then locks the project and checks its current/proposed chapter. Existing projects remain. Remaining chapter editors and admins can manage them. A stale form stops autosave after 401/403/404 and disables writes while preserving unsaved text. |
| Role/chapter changes during upload   | Access is checked before reading the body and again under database locks immediately before storing the file. Unauthorized slow uploads leave no file behind.                                                                                                                                   |
| Cross-chapter collaboration          | A project has one owning Chapter foreign key. Its team may include accessible members from other chapters; team membership does not grant edit permission. Admins can reassign ownership.                                                                                                       |
| Duplicate names                      | Allowed as distinct records with distinct IDs; no automatic merge or uniqueness rule. Editors can browse the directory before creation; an admin can remove a confirmed duplicate. Automatic duplicate warnings remain a future enhancement.                                                    |
| Malformed resource links             | Non-HTTP(S), malformed and unsafe URLs receive field validation errors. Rendering also filters unsafe legacy URLs. Valid private/deleted GitHub or Drive links remain links; remote access permissions and periodic availability checks are outside this ticket.                                |
| Missing partner or thumbnail         | “Partner not listed” and “No preview available” placeholders; video-only projects do not render a broken image. Failed image/video loads show fallback text. Empty optional detail sections remain hidden.                                                                                      |
| No published projects                | Explicit empty state, including chapter-specific text and a link to all chapters. Drafts remain excluded for every dashboard viewer.                                                                                                                                                            |
| Deleted project                      | Read/edit routes return 404; late saves cannot recreate it. The confirmation UI handles repeated deletion gracefully.                                                                                                                                                                           |

Browser-origin checks reject unsafe cross-origin project writes before session processing. Same-origin browser requests and CLI clients without Origin remain supported. `PUBLIC_URL` can identify the canonical origin behind a reverse proxy. These checks complement session authentication and chapter authorization.

### Sorting

`GET /api/projects?sort=name|year|last_updated&chapter_id=<Chapter ID>` applies the chapter filter and whitelisted database ordering before the existing 100-record limit. Default is newest public `lastUpdated`; private pending revisions do not affect it. Year uses descending start date, with missing dates last. Name sorts ascending; stable IDs break ties. Dashboard dropdowns preserve the selected chapter and sort in the URL. A capped result count explicitly says “first 100”.

### Verification and audit findings

- 152 unit tests; 92 database integration tests, including both Lead roles against foreign drafts and published projects, every write endpoint, existing-session revocation, cross-origin attempts, private file deletion, sort results and slow-upload role/chapter races.
- Browser checks against isolated PostgreSQL and actual sessions/APIs cover both Lead cross-chapter UI/API matrices, admin confirmation/cancel/redirect, deletion waiting for autosave, transient delete retry, no post-delete resurrection, sorting, missing-data/empty states and live role revocation.
- Typecheck, lint and production build pass. Lint retains the existing unrelated `DataTable.tsx:125` warning.
- Dependency audit prompted a compatible Next.js / eslint-config-next patch from 16.4.3 to 16.4.6. The subsequent audit reports **0 critical, 2 high, 8 moderate and 1 low** advisories, with no remaining Next.js entries. High findings are transitive lodash (via Prisma Studio) and effect (via Prisma config); remaining findings involve minimatch, hono and @hono/node-server through tooling. These require separate dependency maintenance and are not a clean dependency-security bill. No broad dependency overrides or major upgrades were introduced.

Run the maintained automated checks with `pnpm typecheck`, `pnpm test`, and `pnpm lint`. Run `pnpm test:int` only with an isolated local `DATABASE_URL` whose database name contains `_test` or `ticket4`; it creates and cleans up its own fixtures. The interactive checks above used disposable browser fixtures and did not modify the normal development database.
