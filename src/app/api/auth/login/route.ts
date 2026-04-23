import { db } from "@/lib/db";
import { loginRequestSchema } from "@/lib/validators/auth";
import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";

export async function POST(request: Request) {
  const errorResponse = NextResponse.json(
    { error: "Invalid email or password" },
    { status: 401 }
  );

  try {
    const body = await request.json();
    const login = loginRequestSchema.parse(body);
    const user = await db.user.findUnique({ where: { email: login.email } });
    if (user == null || user.passwordHash == null) {
      return errorResponse;
    }
    const verified = await verifyPassword(login.password, user.passwordHash);

    if (verified) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const session = await db.session.create({
        data: { userId: user.id, expiresAt },
      });

      return NextResponse.json(
        { message: "Logged in" },
        {
          status: 200,
          headers: {
            "Set-Cookie": `session=${session.id}; HttpOnly; Secure; path=/; SameSite=Lax; Max-Age=2592000`,
          },
        }
      );
    } else {
      return errorResponse;
    }
  } catch (error) {
    console.error(error);
    return errorResponse;
  }
}
