/**
 * Member-facing directory visibility helpers (Week 1).
 *
 * Directory access is authenticated (app session), not public web.
 *
 * Enforcement today:
 * - Database: ownership change (A→B or A→null) → directoryOptIn forced false
 *   (trigger, null-safe); per-table userId uniqueness; approval/opt-in/hidden defaults.
 * - Application (this module): pure helpers for future reads — call sites must use them.
 *
 * UNFINISHED — duplicate active Member+Alumni identities:
 * - No Prisma Member/Alumni directory list/detail/count API exists yet (volunteers UI
 *   still reads Notion via getVolunteers).
 * - hasDuplicateActiveDirectoryIdentities only detects; it does NOT enforce.
 * - Later reads must exclude or surface conflicts consistently across lists, details,
 *   and counts without deleting profiles or picking an arbitrary winner.
 *
 * Unresolved PRD policy: whether admins may edit another person’s profile.
 */

export type DirectoryApprovalStatusName = "PENDING" | "APPROVED" | "REJECTED";

export type DirectoryVisibilityFields = {
  userId: string | null;
  approvalStatus: DirectoryApprovalStatusName;
  directoryOptIn: boolean;
  adminHidden: boolean;
};

/**
 * Member-facing visibility for a single Member or Alumni row:
 *   userId IS NOT NULL
 *   AND approvalStatus === APPROVED
 *   AND directoryOptIn === true
 *   AND adminHidden === false
 *
 * Claiming/owning alone does not satisfy this. COD is not granted unpublished access.
 */
export function isMemberFacingDirectoryVisible(
  profile: DirectoryVisibilityFields
): boolean {
  return (
    profile.userId != null &&
    profile.approvalStatus === "APPROVED" &&
    profile.directoryOptIn === true &&
    profile.adminHidden === false
  );
}

/**
 * Detection-only helper for dual Member+Alumni visibility.
 * NOT enforced by DB or by any current directory read path.
 */
export function hasDuplicateActiveDirectoryIdentities(
  member: DirectoryVisibilityFields | null | undefined,
  alumni: DirectoryVisibilityFields | null | undefined
): boolean {
  const memberVisible = member ? isMemberFacingDirectoryVisible(member) : false;
  const alumniVisible = alumni ? isMemberFacingDirectoryVisible(alumni) : false;
  return memberVisible && alumniVisible;
}

/** Prisma where-input matching isMemberFacingDirectoryVisible (for future APIs). */
export const memberFacingDirectoryWhere = {
  userId: { not: null },
  approvalStatus: "APPROVED" as const,
  directoryOptIn: true,
  adminHidden: false,
};
