import type { Viewer } from "@/lib/sourced-projects/contact-gating";

// Posting, editing, and withdrawing a listing is limited to leaders of the
// sourcing chapter and admins.
export function canManageListing(
  viewer: Viewer,
  sourcingChapterId: string
): boolean {
  if (viewer.role === "ADMIN") return true;
  return (
    viewer.role === "CHAPTER_LEADER" && viewer.chapterId === sourcingChapterId
  );
}
