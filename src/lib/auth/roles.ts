import type { AppRole } from "@/types";

export const APP_ROLES = [
  "NATIONAL_ADMIN",
  "CHAPTER_LEAD",
  "PROJECT_LEAD",
  "MEMBER",
] as const satisfies readonly AppRole[];

export const ADMIN_ROLES = [
  "NATIONAL_ADMIN",
] as const satisfies readonly AppRole[];

// May create/edit records in the directory UI.
export const EDITOR_ROLES = [
  "NATIONAL_ADMIN",
  "CHAPTER_LEAD",
  "PROJECT_LEAD",
] as const satisfies readonly AppRole[];

export const CHAPTER_LEADERSHIP_ROLES = [
  "NATIONAL_ADMIN",
  "CHAPTER_LEAD",
] as const satisfies readonly AppRole[];

export function hasRole(role: string, allowed: readonly AppRole[]): boolean {
  return (allowed as readonly string[]).includes(role);
}

// Nationals can act for any chapter; chapter leads only for their own.
export function canActForChapter(
  viewer: { role: string; chapterId: string | null },
  chapterId: string
): boolean {
  if (viewer.role === "NATIONAL_ADMIN") return true;
  return viewer.role === "CHAPTER_LEAD" && viewer.chapterId === chapterId;
}

// Member/Alumni directory moderation: approve, reject, manual create, claim
// tokens, audit log, and role changes. Nationals only.
export const DIRECTORY_ADMIN_ROLES = ADMIN_ROLES;

export function isDirectoryAdmin(role: string): boolean {
  return hasRole(role, DIRECTORY_ADMIN_ROLES);
}

/**
 * Who may change User.role: a directory admin, never on their own account, and
 * only to a real role. nextRole arrives from a server action, so it is checked
 * at runtime rather than trusted from the type.
 */
export function canAssignUserRole(input: {
  actorRole: AppRole;
  actorUserId: string;
  targetUserId: string;
  targetCurrentRole: AppRole;
  nextRole: AppRole;
}): boolean {
  const { actorRole, actorUserId, targetUserId, targetCurrentRole, nextRole } =
    input;

  if (actorUserId === targetUserId) return false;
  if (targetCurrentRole === nextRole) return false;
  if (!hasRole(nextRole, APP_ROLES)) return false;
  return isDirectoryAdmin(actorRole);
}
