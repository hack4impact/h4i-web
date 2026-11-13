import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { AppRole } from "@/types";

// Shared by the JSON API and server-rendered detail page to avoid divergent access rules.
export async function getProjectDetail(
  id: string,
  viewer: { id?: string; email?: string | null; role: AppRole }
) {
  const visibility: Prisma.ProjectWhereInput[] = [{ isDraft: false }];
  if (viewer.role === "CHAPTER_LEADER") {
    if (viewer.id) visibility.push({ createdBy: viewer.id });
    // Existing auth and directory records use different IDs; verified email bridges them.
    if (viewer.email) visibility.push({ creator: { email: viewer.email } });
  }
  return db.project.findFirst({
    where: { id, ...(viewer.role === "ADMIN" ? {} : { OR: visibility }) },
    include: {
      teamMembers: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { id: "asc" },
      },
      resourceLinks: { orderBy: { id: "asc" } },
    },
  });
}
