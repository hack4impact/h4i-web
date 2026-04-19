import { db } from "@/lib/db";

export function getSession(request: Request) {
  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return null;
  }
  const match = cookie.match(/session=([^;]+)/);
  if (!match) {
    return null;
  }
  const sessionId = match[1];
  return db.session.findUnique({ where: { id: sessionId } });
}
