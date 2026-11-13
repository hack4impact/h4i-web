import type { AppRole } from "@/types";

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
  if (viewer.role === "NATIONAL_ADMIN") return true;
  if (action === "browse" || action === "read") return true;
  if (action === "delete") return false;
  return (
    (viewer.role === "PROJECT_LEAD" || viewer.role === "CHAPTER_LEAD") &&
    Boolean(viewer.chapterId) &&
    viewer.chapterId === chapterId
  );
}
