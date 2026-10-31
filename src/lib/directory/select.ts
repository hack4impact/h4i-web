/**
 * Directory field allow-lists.
 *
 * These are Prisma `select` inputs — the projection happens in the database, so
 * an excluded column is never loaded, never serialised, and cannot be leaked by
 * a forgotten `delete obj.x` downstream.
 *
 * Allow-list, not deny-list. A column added to Member or Alumni in a later
 * migration stays invisible until someone deliberately lists it here.
 *
 * Never selected, in any projection:
 *   userId          — internal ownership link; also an input to the visibility rule
 *   user            — User.email is the PRIVATE account email. Member.contactEmail
 *                     and Alumni.contactEmail are the shareable directory contacts.
 *                     Do not reach User through this relation.
 *   chapterId       — exposed as the nested chapter { id, name } instead
 *   createdAt /
 *   updatedAt       — row bookkeeping, not directory content
 *
 * Moderation state (approvalStatus, directoryOptIn, adminHidden) is excluded from
 * the member-facing projection and present only in the moderation one.
 */

import type { Prisma } from "@prisma/client";

/**
 * Relation ordering is declared separately and typed: `as const` on an inline
 * array would make it a readonly tuple, which Prisma's orderBy input rejects.
 */
const jobExperienceOrderBy: Prisma.AlumniJobExperienceOrderByWithRelationInput[] =
  [{ isCurrent: "desc" }, { startYear: "desc" }];

const hackInvolvementOrderBy: Prisma.AlumniHackInvolvementOrderByWithRelationInput[] =
  [{ startYear: "desc" }];

/** Fields any signed-in viewer may see on a member-facing profile. */
export const directoryProfileSelect = {
  id: true,
  displayName: true,
  contactEmail: true,
  linkedInUrl: true,
  githubUrl: true,
  websiteUrl: true,
  instagramUrl: true,
  graduationYear: true,
  major: true,
  location: true,
  skills: true,
  interests: true,
  bio: true,
  position: true,
  chapter: { select: { id: true, name: true } },
} as const;

/**
 * Moderation state. Added for NATIONALS, and for an owner reading their OWN
 * profile, who needs to know whether it is still pending.
 */
export const directoryModerationFieldsSelect = {
  approvalStatus: true,
  directoryOptIn: true,
  adminHidden: true,
} as const;

export const directoryProfileModerationSelect = {
  ...directoryProfileSelect,
  ...directoryModerationFieldsSelect,
} as const;

/** Alumni-only history, attached to detail reads rather than list reads. */
export const alumniHistorySelect = {
  jobExperiences: {
    select: {
      id: true,
      company: true,
      title: true,
      location: true,
      startYear: true,
      endYear: true,
      isCurrent: true,
      notes: true,
    },
    orderBy: jobExperienceOrderBy,
  },
  hackInvolvements: {
    select: {
      id: true,
      roleLabel: true,
      position: true,
      projectName: true,
      startYear: true,
      endYear: true,
      notes: true,
      chapter: { select: { id: true, name: true } },
    },
    orderBy: hackInvolvementOrderBy,
  },
};

export const alumniDetailSelect = {
  ...directoryProfileSelect,
  ...alumniHistorySelect,
};

export const alumniDetailModerationSelect = {
  ...directoryProfileModerationSelect,
  ...alumniHistorySelect,
};
