import { auth } from "@/lib/auth";
import type { AppRole } from "@/types";

export async function requireRole(...roles: AppRole[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthenticated");
  if (!roles.includes(session.user.role)) throw new Error("Forbidden");
  return session;
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}

export async function requireChapterAccess(chapterId: string) {
  const session = await requireRole("ADMIN", "CHAPTER_LEADER");
  if (
    session.user.role === "CHAPTER_LEADER" &&
    session.user.chapterId !== chapterId
  ) {
    throw new Error("Forbidden");
  }
  return session;
}
