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
