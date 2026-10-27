import { auth } from "@/lib/auth";
import { getProjectDetail } from "@/lib/projects/detail";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { projectId } = await params;
  try {
    const project = await getProjectDetail(projectId, session.user);
    if (!project) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(project);
  } catch (error) {
    console.error("Failed to load project detail", error);
    return Response.json(
      { error: "Project could not be loaded. Please try again." },
      { status: 500 }
    );
  }
}
