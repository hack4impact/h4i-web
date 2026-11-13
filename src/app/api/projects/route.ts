import {
  authorizeProject,
  projectResponse,
  projectViewer,
} from "@/lib/projects/http";
import {
  createProject,
  listProjects,
  parseProjectBody,
} from "@/lib/projects/service";

export async function GET(request: Request) {
  return projectResponse(async () => {
    const viewer = await projectViewer(request);
    return Response.json(
      await listProjects(
        viewer,
        new URL(request.url).searchParams.get("include_drafts") === "true"
      )
    );
  });
}
export async function POST(request: Request) {
  return projectResponse(async () => {
    const viewer = await projectViewer(request);
    if (viewer.role !== "NATIONAL_ADMIN")
      authorizeProject(viewer, "create", viewer.chapterId ?? undefined);
    return Response.json(
      await createProject(viewer, await parseProjectBody(request, true)),
      { status: 201 }
    );
  });
}
