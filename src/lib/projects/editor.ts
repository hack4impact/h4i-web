import { db } from "@/lib/db";
import { ADMIN_ROLES, hasRole } from "@/lib/auth/roles";
import type { ProjectViewer } from "./permissions";

export async function editorOptions(
  viewer: ProjectViewer,
  existingMemberIds: string[] = []
) {
  const admin = hasRole(viewer.role, ADMIN_ROLES);
  const [chapters, users] = await Promise.all([
    db.chapter.findMany({
      where: admin ? {} : { id: viewer.chapterId ?? "" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: admin
        ? {}
        : {
            OR: [
              { chapterId: viewer.chapterId ?? "" },
              { id: { in: existingMemberIds } },
            ],
          },
      select: {
        id: true,
        memberProfile: {
          select: {
            displayName: true,
            directoryOptIn: true,
            approvalStatus: true,
            adminHidden: true,
          },
        },
      },
      orderBy: { id: "asc" },
    }),
  ]);
  return {
    chapters,
    members: users.map((user) => ({
      id: user.id,
      name:
        user.memberProfile &&
        (admin ||
          (user.memberProfile.directoryOptIn &&
            !user.memberProfile.adminHidden &&
            user.memberProfile.approvalStatus === "APPROVED"))
          ? user.memberProfile.displayName || `Member ${user.id.slice(-6)}`
          : `Member ${user.id.slice(-6)}`,
    })),
  };
}
