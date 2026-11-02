import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import Plunk from "@plunk/node";
import { db } from "@/lib/db";
import { magicLinkRequestSchema } from "@/lib/validators/auth";

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

// Same response whether or not the address has an account.
const accepted = () =>
  NextResponse.json(
    { message: "If the email exists, then a link has been sent" },
    { status: 200 }
  );

export async function POST(request: NextRequest) {
  let email: string;
  try {
    const parsed = magicLinkRequestSchema.safeParse(await request.json());
    if (!parsed.success) return accepted();
    email = parsed.data.email;
  } catch {
    return accepted();
  }

  try {
    const token = randomBytes(32).toString("hex");
    const user = await db.user.findUnique({ where: { email } });

    await db.magicLinkToken.create({
      data: {
        id: token,
        email,
        userId: user?.id ?? null,
        expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MS),
      },
    });

    const magicLink = `${process.env.PUBLIC_URL}/api/auth/magic-link/verify?token=${token}`;

    // No mail provider configured: print the link in development.
    if (!process.env.PLUNK_API_KEY) {
      if (process.env.NODE_ENV === "production") {
        console.error("PLUNK_API_KEY is not set; magic link not sent");
      } else {
        console.log(`[dev] Magic link for ${email}: ${magicLink}`);
      }
      return accepted();
    }

    const plunk = new Plunk(process.env.PLUNK_API_KEY);
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

  return accepted();
}
