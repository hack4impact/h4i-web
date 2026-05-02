import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession(request);

  if (session) {
    try {
      await db.session.delete({ where: { id: session.id } });
    } catch {}
  }

  return new Response(null, {
    status: 200,
    headers: { "Set-Cookie": "session=; Max-Age=0; Path=/; HttpOnly" },
  });
}
