import type { AppRole } from "@/types";

/** Notion create/edit pages only — not Member/Alumni moderation. */
export const EDITOR_ROLES = [
  "NATIONALS",
  "CHAPTER_LEAD",
  "PROJECT_LEAD",
] as const satisfies readonly AppRole[];

/** Member/Alumni admin ops: approve, reject, manual create, claims, audit. */
export const DIRECTORY_ADMIN_ROLES = [
  "COD",
  "NATIONALS",
] as const satisfies readonly AppRole[];

export const NATIONALS_ROLES = [
  "NATIONALS",
] as const satisfies readonly AppRole[];
export const COD_ROLES = ["COD"] as const satisfies readonly AppRole[];

export function isDirectoryAdmin(role: AppRole): boolean {
  return (DIRECTORY_ADMIN_ROLES as readonly AppRole[]).includes(role);
}

/**
 * Who may change User.role.
 * COD and NATIONALS are peers for directory work; the only asymmetry is COD itself:
 * only NATIONALS may grant COD or change someone who is already COD.
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
  if (!isDirectoryAdmin(actorRole)) return false;

  // Touching COD (grant or demote) requires Nationals.
  if (nextRole === "COD" || targetCurrentRole === "COD") {
    return actorRole === "NATIONALS";
  }

  return true;
}
