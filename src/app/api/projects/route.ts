import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const projects = await db.project.findMany({
    where: { isDraft: false },
    include: {
      teamMembers: { include: { user: { select: { id: true, name: true } } } },
      resourceLinks: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(projects);
}
