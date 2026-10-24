import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loginRequestSchema } from "@/lib/validators/auth";
import { verifyPassword } from "@/lib/auth/password";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  sessionCookieOptions,
} from "@/lib/auth/cookies";

export async function POST(request: Request) {
  // One generic response for every failure. Telling an unknown email apart
  // from a wrong password would let someone enumerate who has an account.
  const errorResponse = NextResponse.json(
    { error: "Invalid email or password" },
    { status: 401 }
  );

  try {
    const body = await request.json();
    const login = loginRequestSchema.parse(body);

    const user = await db.user.findUnique({ where: { email: login.email } });

    // passwordHash is null for accounts created via magic link.
    if (user == null || user.passwordHash == null) {
      return errorResponse;
    }

    const verified = await verifyPassword(login.password, user.passwordHash);
    if (!verified) {
      return errorResponse;
    }

    // The session id IS the bearer token in the cookie, so it must be
    // unguessable. Generated explicitly rather than relying on the schema's
    // @default(cuid()) — cuid is collision-resistant, not cryptographically
    // random, and a predictable token means a forgeable login.
    const session = await db.session.create({
      data: {
        id: randomBytes(32).toString("hex"),
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
      },
    });

    const response = NextResponse.json(
      { message: "Logged in" },
      { status: 200 }
    );
    response.cookies.set({
      name: SESSION_COOKIE,
      value: session.id,
      ...sessionCookieOptions,
    });
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse;
  }
}
