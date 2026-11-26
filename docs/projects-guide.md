# Project directory: Lead and Admin guide

## Open the directory

Sign in and open **Projects**. Search by project, nonprofit or chapter name; chapter suggestions appear as you type. Filters combine across Chapter, Stage, Project length and Impact area. Results update after a short pause. Remove a chip to clear one filter, or choose **Clear filters**. Sort and page links preserve your filters; URLs can be bookmarked or shared with another signed-in member.

Length is calculated from the saved start/end dates: up to 180 days, 181–365 days, or over 365 days. A missing date is **Length not set**. These explicit day ranges are the implementation baseline because the PRD does not define semester boundaries. A project without a thumbnail or partner displays a fallback. Open a card's project name to see its narrative, team, media and links.

## Lead: create, resume and publish

1. Choose **Add Project**. Your chapter is assigned automatically. Project and Chapter Leads can edit any project in their own chapter.
2. Fill the six sections. Pick the stage; required markers change with it. Select actual Member Directory records and enter their project roles. If a person is missing, their directory profile must complete its visibility/approval workflow; typing an account email does not create a member record.
3. Search the Nonprofit Partner field. Select a directory result, or use its name as free text when the directory is unavailable. Partner photo, end date and demo media are optional.
4. Wait for **Draft saved · Just now**. Autosave runs after 750 ms; **Save Draft** retries a temporary failure. Invalid URLs and incomplete dynamic rows need correction. Incomplete publish-required fields can still be saved.
5. Use **Resume a draft** to return to an unpublished project. Its URL also resumes it directly. Drafts never appear on the dashboard, even for an Admin.
6. Choose **Publish Changes**. Follow linked field errors to their sections, correct them, and retry. Success opens the detail page. Editing a live project keeps the current public version unchanged until republishing.

Design requires a name, tagline, partner, start date, problem, goal and team member with a role. Development, Launched and Maintenance also require solution text and a valid resource link. External link sharing is managed by GitHub/Drive/etc.; publication cannot grant those permissions.

If your role changes or the project moves to another chapter, the editor preserves unsaved text but stops writes and asks you to reload. Previously published projects remain in the archive. Do not close a page with unsaved changes until you have copied any text you need to retain.

## Admin: manage any chapter

Choose the correct Chapter when creating a project. Use **Edit** on any detail page; changing its chapter is saved privately until publication. Old chapter Leads cannot publish a pending transfer into a foreign chapter. After publication, the new chapter's Leads manage it.

**Delete Project** opens a permanent-deletion confirmation. Cancel leaves it intact; **Delete permanently** removes the project and its drafts, team/link rows and local media. Use a disposable demo project when trying this. Leads cannot delete. Canonical directory member/partner records are retained.

## Local demo setup

```bash
npx pnpm install
npx pnpm db:up
npx pnpm db:generate
npx pnpm db:deploy
npx pnpm db:seed
npx pnpm dev
```

Open `http://localhost:3000/sign-in`. Local seed accounts use password `password`: `projectlead@hack4impact.org` (Cornell Project Lead), `lead.uiuc@hack4impact.org` (UIUC Chapter Lead), `admin@hack4impact.org`, and `member@hack4impact.org`. Seed commands are development fixtures, not production account provisioning.

The archive seed creates 15 `[Demo]` projects across three chapters/all stages (12 published and three drafts on a fresh database). Rerunning preserves existing archive fixtures and your edits; it recreates any deleted fixture. They are database rows, not files to commit. The regular seed does not create Member Directory profiles; populate them through that feature's own workflow before demoing a new team selection. The Notion project table is no longer part of this page; partner search still uses the Partner Directory and falls back to plain text without Notion configuration.

If no projects appear, clear filters, check for published records, and run the seed on the same local database used by the app. Database connection errors mean the local Postgres container must be started. A `.next/dev/lock` error means another development server is already running; stop that server before starting another.
