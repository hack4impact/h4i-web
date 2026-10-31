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
  alumniDetailModerationSelect,
  alumniDetailSelect,
  directoryProfileModerationSelect,
  directoryProfileSelect,
} from "@/lib/directory/select";

/**
 * Alumni directory reads. Same three tiers and the same rule source as
 * members.ts — Alumni is stored separately by design, so the queries are
 * separate, but the visibility clause and field allow-list are shared.
 *
 * Job experience and Hack involvement are attached to detail reads only; a list
 * does not need them and they would multiply the row count.
 */

export async function listAlumni() {
  await assertSession();

  return db.alumni.findMany({
    where: directoryListWhere(),
    select: directoryProfileSelect,
    orderBy: [{ displayName: "asc" }, { id: "asc" }],
  });
}

/** See getMember — null covers both "no such id" and "not visible to you". */
export async function getAlumniProfile(id: string) {
  const viewer = await requireDirectoryViewer();

  if (!id) {
    return null;
  }

  return db.alumni.findFirst({
    where: { id, ...directoryDetailWhere(viewer) },
    select: canViewUnpublishedDirectoryProfiles(viewer.role)
      ? alumniDetailModerationSelect
      : alumniDetailSelect,
  });
}

export async function getMyAlumniProfile() {
  const viewer = await requireDirectoryViewer();

  return db.alumni.findUnique({
    where: { userId: viewer.userId },
    select: alumniDetailModerationSelect,
  });
}

/**
 * Present so a caller that only needs the card fields is not forced to pull
 * employment history. Same visibility rule.
 */
export async function getAlumniSummary(id: string) {
  const viewer = await requireDirectoryViewer();

  if (!id) {
    return null;
  }

  return db.alumni.findFirst({
    where: { id, ...directoryDetailWhere(viewer) },
    select: canViewUnpublishedDirectoryProfiles(viewer.role)
      ? directoryProfileModerationSelect
      : directoryProfileSelect,
  });
}
