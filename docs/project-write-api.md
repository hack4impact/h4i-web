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

Draft saving is manual in this ticket. Background autosave, conflict resolution and searchable partner/member selectors remain future work.

### Media uploads

`POST /api/projects/:id/media` accepts a multipart `file` for a scoped editor and returns a media URL. The form creates a minimal draft first if an upload needs a project ID. Uploaded media is linked by Save Draft and becomes visible to members only after successful publication. Selected photos and videos can be previewed and removed from the proposed project.

Uploads support PNG, JPEG, WebP, GIF, MP4 and WebM, up to 20 MB per file and 50 linked media items per project. The endpoint bounds request size, checks file signatures against the declared MIME type, uses generated filenames, and stores files outside `public/`. `GET /api/projects/:id/media/:file` authenticates access, hides draft/unpublished media from members, disables public caching, and supports byte ranges for video playback.

Local files are stored under `.data/project-media` (ignored by Git), or `PROJECT_MEDIA_DIR` when configured. **Deployment requires a persistent writable directory/volume shared by all app instances.** Ephemeral serverless filesystems do not provide durable upload storage. No object storage service is configured. Removing a media item removes its project reference; unreferenced files remain on disk and require separate storage cleanup.

Project APIs now use `assertSession` / `assertRole`, with an optional Request argument for route handlers and integration tests, and the shared role helpers. Existing no-argument server actions keep their previous behavior. Unit tests cover form payloads, dates, URL validation and media signatures. Database tests cover upload authorization, draft privacy, publishing media, byte ranges and invalid uploads.
