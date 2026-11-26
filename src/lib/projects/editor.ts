import { searchMemberReferences, selectedMemberReferences } from "./references";
import { db } from "@/lib/db";
import { ADMIN_ROLES, hasRole } from "@/lib/auth/roles";
import type { ProjectViewer } from "./permissions";

export async function editorOptions(
  viewer: ProjectViewer,
  existingUserIds: string[] = []
) {
  const admin = hasRole(viewer.role, ADMIN_ROLES);
  const [chapters, available, selected] = await Promise.all([
    db.chapter.findMany({
      where: admin ? {} : { id: viewer.chapterId ?? "" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    searchMemberReferences(),
    selectedMemberReferences(viewer, existingUserIds),
  ]);
  const members = [
    ...selected,
    ...available.filter(
      (member) => !selected.some((item) => item.id === member.id)
    ),
  ];
  return { chapters, members };
}
