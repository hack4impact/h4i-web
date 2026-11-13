# Project Directory MVP1 leadership demo

Status: implementation and local verification complete; leadership walkthrough and final filter-pattern choice are pending. No leadership decision has been recorded.

## Preparation

Start the seeded PostgreSQL database, run `npm run dev`, and sign in at `http://localhost:3000/sign-in` with the existing development account (`admin@hack4impact.org` / `password`). Use `localhost` consistently. The API and browser checks also verify read-only member sessions; the existing development sign-in provider only offers the admin account.

## Three-minute walkthrough

1. Open **Project Directory**. Show the 12 published projects, card metadata, and pagination. Explain that the other three seed records are drafts and never appear in browse/search results.
2. Type **Sched**, then **Scheduler**. Search waits 300 ms after typing stops and returns Volunteer Scheduler. Remove its search chip to return to all results.
3. Type **Chi**. Choose **Chicago** with the mouse or Arrow Down then Enter. This selects the chapter filter, clears the text query, and shows a removable Chicago chip and **Results: 4**.
4. Select **Development**, **Ongoing**, and **Volunteer Ops**. Show all four chips and **Results: 2**. Search **Library** within that combination to get **Results: 1**. Remove any chip to demonstrate that the count updates.
5. Click **Library Outreach**. Show the tagline, stage/chapter/year badges, partner/timeline/last-updated card, Project Goal, Team, Solution, and Resource Links. Team initials are avatar fallbacks. Demo Media is hidden on seed projects because the seed has no uploaded photos/videos; populated records support photos and playable videos. Other empty optional sections are also hidden.
6. Return to the directory. Search a nonexistent project to show the empty state, then clear filters. Narrow the browser to show the mobile grid and navigation.
7. Explain that members and unrelated leads get a 404 for drafts. Admins and the creating Project Lead can open draft detail URLs; chapter-wide lead access remains dependent on the planned chapter/permission integration.

## Filter UI decision to capture

Demonstrate the current expanded dropdown panel, then collapse it with **Filters**. Ask leadership to choose whether to retain this pattern or replace it with a popover/drawer. Compare visibility of available filters, space left for project cards, and ease of use on mobile. The filtering API and chips remain the same for either choice.

Record the selected pattern, decision-maker, date, and any requested adjustments here after the review. Until then, the dropdown panel remains the implemented pattern.

## Limits to mention if asked

Search, filtering, pagination, and full read-only details are implemented. Create/edit, autosave, publishing, uploads, and full chapter-scoped lead management are MVP2 work. Chapter/partner IDs still reference external directory data; team membership uses local users. Real member avatar fields are not present yet. The existing full-project typecheck failures involve unrelated button variants.
