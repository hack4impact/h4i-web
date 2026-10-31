import type { AppRole } from "@/types";
import { NATIONALS_ROLES } from "@/lib/auth/roles";

/**
 * Member-facing directory visibility — the single source of truth for which
 * Member / Alumni rows a given viewer may read.
 *
 * Directory access is authenticated (app session), not public web.
 *
 * Enforcement:
 * - Database: ownership change (A→B or A→null) → directoryOptIn forced false
 *   (trigger, null-safe); per-table userId uniqueness; approval/opt-in/hidden defaults.
 * - Application (this module): the where-builders below. Every directory read
 *   MUST obtain its where clause from here. Do not hand-roll the predicate at a
 *   call site, and do not fetch a row and filter it in JavaScript afterwards —
 *   a row that reaches the server has already left the database.
 *
 * List/search reads: `src/lib/directory/search.ts` builds SQL from
 * `MEMBER_FACING_VISIBILITY` / `memberFacingDirectoryWhere` (same constants as
 * `isMemberFacingDirectoryVisible`). Do not hand-roll a parallel predicate.
 * Notion `/volunteers` is a separate legacy surface.
 *
 * Three access tiers:
 *   1. Any signed-in viewer  → member-facing rows only.
 *   2. Owner                 → additionally their own row, whatever its state.
 *   3. NATIONALS             → any row. COD is NOT included (see roles.ts).
 *
 * UNFINISHED — duplicate active Member+Alumni identities:
 * - hasDuplicateActiveDirectoryIdentities only detects; it does NOT enforce.
 * - List, detail, and count must stay consistent about conflicts without
 *   deleting profiles or picking an arbitrary winner.
 *
 * Unresolved PRD policy: whether admins may EDIT another person's profile.
 * This module governs reads only.
 */

export type DirectoryApprovalStatusName = "PENDING" | "APPROVED" | "REJECTED";

export type DirectoryVisibilityFields = {
  userId: string | null;
  approvalStatus: DirectoryApprovalStatusName;
  directoryOptIn: boolean;
  adminHidden: boolean;
};

/**
 * Single source of truth for member-facing visibility scalars.
 * Used by the JS predicate, Prisma where-input, and directory search SQL.
 */
export const MEMBER_FACING_VISIBILITY = {
  approvalStatus: "APPROVED" as const satisfies DirectoryApprovalStatusName,
  directoryOptIn: true,
  adminHidden: false,
};

/** Who is asking. userId is the User.id on the session, never a profile id. */
export type DirectoryViewer = {
  userId: string;
  role: AppRole;
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
    profile.approvalStatus === MEMBER_FACING_VISIBILITY.approvalStatus &&
    profile.directoryOptIn === MEMBER_FACING_VISIBILITY.directoryOptIn &&
    profile.adminHidden === MEMBER_FACING_VISIBILITY.adminHidden
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

/** Prisma where-input matching isMemberFacingDirectoryVisible. */
export const memberFacingDirectoryWhere = {
  userId: { not: null },
  approvalStatus: MEMBER_FACING_VISIBILITY.approvalStatus,
  directoryOptIn: MEMBER_FACING_VISIBILITY.directoryOptIn,
  adminHidden: MEMBER_FACING_VISIBILITY.adminHidden,
};

/**
 * May this role read profiles that are not member-facing (pending, rejected,
 * opted out, admin-hidden, or unclaimed)?
 *
 * NATIONALS only. COD is a distinct administrator type and inherits nothing
 * here; CHAPTER_LEAD and PROJECT_LEAD are editors of other records, which is
 * not the same entitlement.
 */
export function canViewUnpublishedDirectoryProfiles(role: AppRole): boolean {
  return (NATIONALS_ROLES as readonly AppRole[]).includes(role);
}

/**
 * Where clause for directory LIST reads.
 *
 * Deliberately takes no viewer: lists are member-facing for everyone, including
 * NATIONALS. Unpublished rows reach an admin through the detail path or through
 * a future moderation queue that is explicitly scoped to that purpose — never by
 * silently widening the directory everyone else browses.
 */
export function directoryListWhere() {
  return { ...memberFacingDirectoryWhere };
}

/**
 * Where clause for directory DETAIL reads.
 *
 * Spread it alongside the id so the visibility test runs IN the query:
 *
 *   db.member.findFirst({ where: { id, ...directoryDetailWhere(viewer) } })
 *
 * A viewer with no entitlement gets null, which is indistinguishable from the
 * id not existing. That is the point: 404, never 403, so a hidden profile's
 * existence is not confirmed.
 *
 * Returns {} for NATIONALS — no visibility restriction, id alone decides.
 */
export function directoryDetailWhere(viewer: DirectoryViewer) {
  if (canViewUnpublishedDirectoryProfiles(viewer.role)) {
    return {};
  }

  const branches: Array<Record<string, unknown>> = [
    { ...memberFacingDirectoryWhere },
  ];

  // An empty or missing userId must never match a row. Member.userId and
  // Alumni.userId are nullable, so an unguarded owner branch on a falsy value
  // would be a live path to every unclaimed profile.
  if (viewer.userId) {
    branches.push({ userId: viewer.userId });
  }

  return { OR: branches };
}
