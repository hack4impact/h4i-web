import { assertSession } from "@/lib/auth/guards";
import type { AppRole } from "@/types";
import type { DirectoryViewer } from "@/lib/directory/visibility";

/**
 * Resolves the signed-in viewer for a directory read, or throws.
 *
 * Kept out of visibility.ts on purpose: that module must stay free of
 * next/headers so its rules can be unit tested without a request context.
 *
 * assertSession throws rather than redirecting, which is correct here —
 * server actions are called programmatically, not navigated to.
 */
export async function requireDirectoryViewer(): Promise<DirectoryViewer> {
  const session = await assertSession();

  return {
    userId: session.user.id,
    role: session.user.role as AppRole,
  };
}
