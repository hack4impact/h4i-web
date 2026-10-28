import { NextRequest, NextResponse } from "next/server";
import { magicLinkRequestSchema } from "@/lib/validators/auth";
import { db } from "@/lib/db";
import crypto from "crypto";
import Plunk from "@plunk/node";

/**
 * Given an email, we create a magic link using tokens for user to then explore the website. This is for first-time users and returning users. If user email does not exist, we do nothing.
 *
 * @param request body that has the user email.
 * @returns 200 request no matter the outcome.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  // invalid email provided
  if (!magicLinkRequestSchema.safeParse(body).success) {
    return NextResponse.json(
      { message: "If the email exists, then a link has been sent" },
      { status: 200 }
    );
  }

  try {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 15 * 1000);
    const email = magicLinkRequestSchema.parse(body).email;

    const user = await db.user.findUnique({
      where: { email: email },
    });

    // create magic token with user id or without it
    await db.magicLinkToken.create({
      data: {
        id: token,
        email: email,
        userId: user?.id || null,
        expiresAt: expiresAt,
      },
    });

    const magicLink = `${process.env.PUBLIC_URL}/api/auth/magic-link/verify?token=${token}`;

    // Constructed after the token row exists, so a missing PLUNK_API_KEY
    // cannot stop the token being issued — it can still be verified manually
    // in development where no mail provider is configured.
    const plunk = new Plunk(process.env.PLUNK_API_KEY!);

    // send email to the user
    await plunk.emails.send({
      to: email,
      subject: "Your Magic Link",
      body: `
        <h1>Sign in to your account</h1>
        <p>Copy this link: <a href="${magicLink}">${magicLink}</a></p>
        <p>This link expires in 15 minutes</p>
      `,
    });
  } catch (err) {
    console.error("Magic link error:", err);
  }

  return NextResponse.json(
    { message: "If the email exists, then a link has been sent" },
    { status: 200 }
  );
}
