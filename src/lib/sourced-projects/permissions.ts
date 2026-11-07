import { canActForChapter } from "@/lib/auth/roles";
import type { Viewer } from "@/lib/sourced-projects/contact-gating";

// Posting, editing, and withdrawing a listing is limited to leaders of the
// sourcing chapter and admins.
export function canManageListing(
  viewer: Viewer,
  sourcingChapterId: string
): boolean {
  return canActForChapter(viewer, sourcingChapterId);
}
