# Project archive API reference

All routes use the existing session cookie and live database roles. Pages are under `/projects`; JSON routes are under `/api/projects`. Responses use camelCase. Same-origin browser writes are required; CLI clients may omit Origin. Do not copy session tokens into documentation or Git.

## Browse and search

`GET /api/projects` returns an array. Defaults: published records, page 1, 12 per page, newest public update first. Headers provide `X-Total-Count`, `X-Page`, `X-Page-Size`, and `X-Total-Pages`. Out-of-range positive pages clamp to the last page; an empty result has page 1 of 1. Sorting and filtering happen before pagination.

| Parameter           | Values / behavior                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `q`                 | Up to 200 characters; case-insensitive substring in project name, tagline, partner name, or Chapter name. Public fields only.                            |
| `chapter_id`        | Canonical Chapter ID. Unknown IDs yield an empty API result; unknown chapter IDs in the page URL yield 404.                                              |
| `stage`             | `design`, `development`, `launched`, `maintenance`                                                                                                       |
| `project_length`    | `short`: 0–180 days; `medium`: 181–365 days; `long`: over 365 days; `unknown`: missing start or end date. Uses end date minus start date.                |
| `impact_area`       | Exact cause-area tag, including case; dropdown values come only from published projects.                                                                 |
| `sort`              | `last_updated` (default), `name`, `year`. Year uses descending start date. Missing dates sort last; IDs break ties.                                      |
| `page`, `page_size` | Positive integers; page maximum 100000, page size maximum 100.                                                                                           |
| `include_drafts`    | Only literal `true` includes authorized drafts: own chapter for Leads, every chapter for Admins, none for Members. The dashboard always excludes drafts. |

Filters combine with AND; search matches its supported fields with OR. Blank text/select filters are ignored. Invalid recognized query values return 400. Example:

```text
/api/projects?chapter_id=chapter-cornell&stage=development&project_length=short&impact_area=Education&q=community&page=1&page_size=12
```

`GET /api/projects/:id` returns a public record or an authorized draft. `?draft=true` returns a proposed revision for permitted editors. Hidden/missing records return 404. Pending fields never affect public search, tags, results counts, or sorting.

## Write and reference routes

| Method and route                              | Purpose                                                                                                                             | Success   |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `POST /api/projects`                          | Create a draft; name required. Leads get their chapter; Admins must supply chapterId.                                               | 201       |
| `PATCH /api/projects/:id`                     | Partial save; arrays replace their collection when supplied. Published records retain a separate private revision.                  | 200       |
| `POST /api/projects/:id/publish`              | Validate proposed fields and make them public. No editable body; save first.                                                        | 200       |
| `DELETE /api/projects/:id`                    | National Admin only; deletes project, team/link rows and attempts private media cleanup.                                            | 204       |
| `POST /api/projects/:id/media`                | Multipart `file`; optional `purpose=partner-photo` restricts to images. PNG/JPEG/WebP/GIF/MP4/WebM, 20 MB maximum. Returns `{url}`. | 201       |
| `GET /api/projects/:id/media/:file`           | Authenticated media; unpublished files hidden from members; video byte ranges supported.                                            | 200 / 206 |
| `GET /api/projects/references/members?q=...`  | Editors only; visible canonical member records, at most 100 search characters.                                                      | 200       |
| `GET /api/projects/references/partners?q=...` | Editors only; Partner Directory projection or `{partners:[], available:false}` for free-text fallback.                              | 200       |

Example create payload for an Admin (a Lead may omit chapterId):

```json
{
  "name": "Community Portal",
  "chapterId": "chapter-cornell",
  "stage": "design"
}
```

Editable fields: name, chapterId, stage, tagline (180 chars), techStack, causeAreas, nonprofitPartnerId/Name/Photo, startDate/endDate (`YYYY-MM-DD`), problemStatement, goalStatement, solutionDescription, demoMedia, teamMembers (`userId`, optional `memberId`, `role`) and resourceLinks (`type`, `url`). Resource types are `Slack`, `GitHub`, `GoogleDrive`, `Other`. HTTP(S) URLs only; media also accepts safe local paths. Snake-case aliases are supported for write fields; conflicting aliases and server-owned fields are rejected. Omit fields to retain them; nullable scalars may be cleared with null and collections with `[]`.

Project/Chapter Leads may create, edit, publish and upload only in their current chapter. Members are read-only. Admins manage every chapter. Team membership alone grants no write permission. Role/chapter changes are rechecked on every write, including after a slow upload.

Design publishing requires name, tagline, partner ID or name, start date, problem, goal, and at least one real team member with a role. Other stages also require solution and a resource link. Missing required fields do not block draft saves.

Errors are `{error, details?}`: 400 invalid formats/references/query, 401 expired/missing session, 403 forbidden write, 404 hidden/missing record, 409 relation changed, 413 upload too large, 416 unsatisfiable media range, 422 publish requirements (`details.missingFields`), 500 generic failure. See [implementation and storage notes](project-write-api.md) for limits and deployment requirements.
