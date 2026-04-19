import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

/**
 * Creates 30 day session from token and redirects to dashboard for any user.
 * If token has been used, does not exist, or has a problem return 400 error.
 *
 * @param request the token url
 * @returns redirection to the dashboard or a 400 error message.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token was not given in the parameters" },
      { status: 400 }
    );
  }

  const t = await db.magicLinkToken.findUnique({
    where: { id: token },
  });

  // check for all invalid cases of using token
  if (!t) {
    return NextResponse.json(
      { error: "Token does not exist" },
      { status: 400 }
    );
  } else if (t.usedAt !== null) {
    return NextResponse.json(
      { error: "Token already been used" },
      { status: 400 }
    );
  } else if (new Date() > t.expiresAt) {
    return NextResponse.json({ error: "Token has expired" }, { status: 400 });
  }

  // token now has been used
  await db.magicLinkToken.update({
    where: { id: t.id },
    data: {
      usedAt: new Date(),
    },
  });

  let userId = t.userId;

  // if user does not exist, we create a new user with default role set to Volunteer
  if (t.userId === null) {
    const res = await db.user.create({
      data: {
        email: t.email,
      },
    });
    userId = res.id;
  }

  // creating session
  const sessionToken = crypto.randomBytes(32).toString("hex");
  await db.session.create({
    data: {
      sessionToken,
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // redirect user to dashboard with a max session limit of 30 days only on HTTPs
  const response = NextResponse.redirect(new URL("/dashboard", request.url));

  response.cookies.set({
    name: "sessionToken",
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
