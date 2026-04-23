import { db } from "@/lib/db";
import { loginRequestSchema } from "@/lib/validators/auth";
import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/password";

export async function POST(request: Request) {
  const errorResponse = NextResponse.json(
    { error: "Invalid email or password" },
    { status: 401 }
  );

  try {
    const body = await request.json();
    try {
      const login = loginRequestSchema.parse(body);
      const user = await db.user.findUnique({ where: { email: login.email } });
      if (user == null || user.passwordHash == null) {
        return errorResponse;
      }
      const verified = await verifyPassword(login.password, user.passwordHash);

      if (verified) {
        const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const session = await db.session.create({
          data: { userId: user.id, expiry },
        });

        return NextResponse.json(
          { message: "Logged in" },
          {
            status: 200,
            headers: {
              "Set-Cookie": `session=${session.id}; HttpOnly; path=/; SameSite=Lax; Max-Age=2592000`,
            },
          }
        );
      } else {
        return errorResponse;
      }
    } catch {
      return errorResponse;
    }
  } catch (error) {
    return errorResponse;
  }
}
