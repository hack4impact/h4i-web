import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loginRequestSchema } from "@/lib/validators/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  sessionCookieOptions,
} from "@/lib/auth/cookies";

// Compared against when the email is unknown, so a failed login takes the same
// time either way and does not reveal whether the account exists.
let dummyHash: Promise<string> | undefined;
function getDummyHash() {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}

// One response for every failure so accounts cannot be enumerated.
const invalid = () =>
  NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

export async function POST(request: Request) {
  try {
    const login = loginRequestSchema.parse(await request.json());

    const user = await db.user.findUnique({ where: { email: login.email } });

    const hash = user?.passwordHash ?? (await getDummyHash());
    const verified = await verifyPassword(login.password, hash);
    if (!user?.passwordHash || !verified) {
      return invalid();
    }

    // The session id is the bearer token in the cookie, so it must be random.
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
    return invalid();
  }
}
