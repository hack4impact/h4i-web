import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionFromRequest, getCurrentSession } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";
import type { AppRole } from "@/types";

export {
  ADMIN_ROLES,
  DIRECTORY_ADMIN_ROLES,
  CHAPTER_LEADERSHIP_ROLES,
  EDITOR_ROLES,
  canActForChapter,
  hasRole,
  isDirectoryAdmin,
} from "@/lib/auth/roles";

/**
 * For pages and layouts. Redirects to sign-in when there is no valid session.
 * Unlike proxy.ts this runs on Node and checks the Session row in the database.
 */
export async function requireSession() {
  const session = await getCurrentSession();

  if (!session) {
    // Set by proxy.ts so the visitor can be sent back after signing in.
    const pathname = (await headers()).get("x-pathname");
    redirect(
      pathname
        ? `/sign-in?callbackUrl=${encodeURIComponent(pathname)}`
        : "/sign-in"
    );
  }

  return session;
}

/** For pages only certain roles may see. Wrong role goes to the dashboard. */
export async function requireRole(allowed: readonly AppRole[]) {
  const session = await requireSession();

  if (!hasRole(session.user.role, allowed)) {
    redirect("/dashboard");
  }

  return session;
}

/**
 * For server actions and route handlers, which can be called without rendering
 * a page, so layout protection does not cover them. Throws instead of redirecting.
 */
export async function assertSession(request?: Request) {
  const session = await (request
    ? getSessionFromRequest(request)
    : getCurrentSession());

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function assertRole(
  allowed: readonly AppRole[],
  request?: Request
) {
  const session = await assertSession(request);

  if (!hasRole(session.user.role, allowed)) {
    throw new Error("Forbidden");
  }

  return session;
}
