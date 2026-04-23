import { db } from "@/lib/db";

export async function getSession(request: Request) {
  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return null;
  }
  const match = cookie.match(/session=([^;]+)/);
  if (!match) {
    return null;
  }
  const sessionId = match[1];
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  return session;
}
