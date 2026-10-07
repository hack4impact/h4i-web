import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { projectId } = await params;
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      ...(session.user.role === "ADMIN" ? {} : { isDraft: false }),
    },
    include: {
      teamMembers: { include: { user: { select: { id: true, name: true } } } },
      resourceLinks: true,
    },
  });
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(project);
}
