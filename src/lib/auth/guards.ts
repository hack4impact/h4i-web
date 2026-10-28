import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import type { AppRole } from "@/types";

export { COD_ROLES, EDITOR_ROLES, NATIONALS_ROLES } from "@/lib/auth/roles";

/**
 * For server components (pages and layouts). Returns the session, or sends an
 * unauthenticated visitor to sign-in and never returns.
 *
 * This is the authoritative check: unlike proxy.ts it runs on the Node runtime,
 * so it really does look the session up in the database and verify it has not
 * expired.
 */
export async function requireSession() {
  const session = await getCurrentSession();

  if (!session) {
    // proxy.ts set x-pathname on the forwarded request. Carry it over so the
    // visitor returns to where they were after signing in, instead of being
    // dumped on the dashboard when a session quietly expires.
    const pathname = (await headers()).get("x-pathname");
    redirect(
      pathname
        ? `/sign-in?callbackUrl=${encodeURIComponent(pathname)}`
        : "/sign-in"
    );
  }

  return session;
}

/**
 * For server components that only certain roles may see. Signed-out visitors
 * go to sign-in; signed-in visitors without a listed role go to the dashboard.
 */
export async function requireRole(allowed: readonly AppRole[]) {
  const session = await requireSession();

  if (!allowed.includes(session.user.role as AppRole)) {
    redirect("/dashboard");
  }

  return session;
}

/**
 * For server actions and route handlers, which are called programmatically
 * rather than navigated to — redirecting them makes no sense, so this throws.
 *
 * Server actions are POST endpoints. A client can invoke one directly without
 * ever rendering the page it lives on, so layout protection does nothing for
 * them and each one needs its own check.
 */
export async function assertSession() {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}
