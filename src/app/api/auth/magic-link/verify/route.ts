import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  sessionCookieOptions,
} from "@/lib/auth/cookies";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const failed = (code: "missing-token" | "invalid-link" | "server-error") =>
    NextResponse.redirect(new URL(`/sign-in?error=${code}`, request.url));

  if (!token) return failed("missing-token");

  try {
    const now = new Date();

    // Check and consume in one statement so two requests on the same link
    // cannot both succeed.
    const { count } = await db.magicLinkToken.updateMany({
      where: { id: token, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (count === 0) return failed("invalid-link");

    const consumed = await db.magicLinkToken.findUniqueOrThrow({
      where: { id: token },
      select: { email: true, userId: true },
    });

    // First sign-in for this address creates the account. Upsert in case the
    // address registered between requesting the link and clicking it.
    const userId =
      consumed.userId ??
      (
        await db.user.upsert({
          where: { email: consumed.email },
          update: {},
          create: { email: consumed.email, role: "MEMBER" },
          select: { id: true },
        })
      ).id;

    const session = await db.session.create({
      data: {
        id: randomBytes(32).toString("hex"),
        userId,
        expiresAt: new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000),
      },
    });

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set({
      name: SESSION_COOKIE,
      value: session.id,
      ...sessionCookieOptions,
    });
    return response;
  } catch (err) {
    console.error("Magic link verify error:", err);
    return failed("server-error");
  }
}
