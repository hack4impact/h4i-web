import type { AppRole } from "@/types";

/**
 * Roles allowed to create or edit records on existing directory UI pages
 * (chapters, projects, partners, volunteers) — same shape as the base branch
 * EDITOR_ROLES, with former ADMIN replaced by NATIONALS after the admin-type split.
 *
 * COD is excluded (permissions unspecified; do not inherit Nationals access).
 *
 * This list preserves base volunteer create/edit access for CHAPTER_LEAD and
 * PROJECT_LEAD. It is NOT a resolution of the PRD conflict on whether admins
 * may edit another person’s Member/Alumni directory profile (future APIs).
 */
export const EDITOR_ROLES = [
  "NATIONALS",
  "CHAPTER_LEAD",
  "PROJECT_LEAD",
] as const satisfies readonly AppRole[];

/**
 * Nationals-only capabilities (approval, rejection, moderation, manual profile
 * creation) — not wired to Member/Alumni endpoints in Week 1. COD excluded.
 * Do not use this to silently narrow existing volunteer UI permissions.
 */
export const NATIONALS_ROLES = [
  "NATIONALS",
] as const satisfies readonly AppRole[];

/** COD admin type — distinct; no Nationals permissions implied. */
export const COD_ROLES = ["COD"] as const satisfies readonly AppRole[];
