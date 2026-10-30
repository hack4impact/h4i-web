"use server";

import { db } from "@/lib/db";
import { assertSession } from "@/lib/auth/guards";
import { requireDirectoryViewer } from "@/lib/directory/viewer";
import {
  canViewUnpublishedDirectoryProfiles,
  directoryDetailWhere,
  directoryListWhere,
} from "@/lib/directory/visibility";
import {
  directoryProfileModerationSelect,
  directoryProfileSelect,
} from "@/lib/directory/select";

/**
 * Member directory reads.
 *
 * Every export calls a session guard of its own. The (protected) layout gates
 * PAGES; a server action is a POST endpoint that can be invoked without ever
 * rendering the page it lives on, so layout protection does nothing for it.
 *
 * All three functions get their where clause from @/lib/directory/visibility
 * and their field list from @/lib/directory/select. Neither is rebuilt here.
 */

/**
 * Member-facing list. Approved, opted-in, claimed, not admin-hidden — for every
 * viewer including NATIONALS. Unpublished rows never appear in a list.
 */
export async function listMembers() {
  await assertSession();

  return db.member.findMany({
    where: directoryListWhere(),
    select: directoryProfileSelect,
    // displayName is nullable; id breaks ties so paging stays deterministic.
    orderBy: [{ displayName: "asc" }, { id: "asc" }],
  });
}

/**
 * Detail by id. Returns null when the profile does not exist OR the viewer may
 * not see it — deliberately indistinguishable. Callers render notFound() on
 * null, so a hidden profile answers 404 rather than 403, which would confirm
 * that it exists.
 *
 * The visibility test is part of the query, not a check on the returned row.
 */
export async function getMember(id: string) {
  const viewer = await requireDirectoryViewer();

  if (!id) {
    return null;
  }

  return db.member.findFirst({
    where: { id, ...directoryDetailWhere(viewer) },
    select: canViewUnpublishedDirectoryProfiles(viewer.role)
      ? directoryProfileModerationSelect
      : directoryProfileSelect,
  });
}

/**
 * The owner path. Returns the viewer's own profile whatever its state, with
 * moderation fields, so they can see that it is still pending or hidden.
 *
 * Member.userId is unique and nullable; the viewer's own id is always a
 * non-empty string, so this cannot match an unclaimed row.
 */
export async function getMyMemberProfile() {
  const viewer = await requireDirectoryViewer();

  return db.member.findUnique({
    where: { userId: viewer.userId },
    select: directoryProfileModerationSelect,
  });
}
