import type { AppRole } from "@/types";
import { ADMIN_ROLES, EDITOR_ROLES, hasRole } from "@/lib/auth/roles";

export type ProjectViewer = {
  id: string;
  role: AppRole;
  chapterId: string | null;
};
export type ProjectAction =
  "browse" | "read" | "readDraft" | "create" | "edit" | "publish" | "delete";

// Do not change the shared chapter leadership guard: project leads have project
// permissions, not the chapter administration permissions of CHAPTER_LEAD.
export function canProjectAction(
  viewer: ProjectViewer,
  action: ProjectAction,
  chapterId?: string
): boolean {
  if (hasRole(viewer.role, ADMIN_ROLES)) return true;
  if (action === "browse" || action === "read") return true;
  if (action === "delete") return false;
  return (
    hasRole(viewer.role, EDITOR_ROLES) &&
    Boolean(viewer.chapterId) &&
    viewer.chapterId === chapterId
  );
}
