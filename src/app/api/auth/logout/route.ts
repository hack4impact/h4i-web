import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth/session";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/cookies";

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);

  // Deleting the row is what actually revokes the login. Clearing the cookie
  // is a convenience: a stale cookie now points at nothing.
  if (session) {
    try {
      await db.session.delete({ where: { id: session.id } });
    } catch {
      // Already gone — nothing to revoke.
    }
  }

  const response = NextResponse.json(
    { message: "Logged out" },
    { status: 200 }
  );
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    ...sessionCookieOptions,
    maxAge: 0, // expire immediately
  });
  return response;
}
