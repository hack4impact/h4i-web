import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth/cookies";

/**
 * Core lookup — the only function here that touches the database.
 *
 * Returns null for a missing, unknown, or expired token. Callers can treat
 * null as "not signed in" without caring which of those it was.
 */
export async function getSessionByToken(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const session = await db.session.findUnique({
    where: { id: token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session;
}

/**
 * For route handlers, which are handed a Request and read the raw cookie header.
 */
export async function getSessionFromRequest(request: Request) {
  const header = request.headers.get("cookie");
  if (!header) {
    return null;
  }

  // Anchored to a cookie boundary so a cookie named e.g. "otherSessionToken"
  // cannot be mistaken for ours.
  const match = header.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`)
  );

  return getSessionByToken(match?.[1]);
}

/**
 * For server components and server actions, which have no Request object and
 * read cookies through next/headers instead. cookies() is async in Next 16.
 */
export async function getCurrentSession() {
  const cookieStore = await cookies();
  return getSessionByToken(cookieStore.get(SESSION_COOKIE)?.value);
}
