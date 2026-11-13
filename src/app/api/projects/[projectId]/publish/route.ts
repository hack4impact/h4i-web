import {
  authorizeProject,
  projectResponse,
  projectViewer,
} from "@/lib/projects/http";
import { publishProject } from "@/lib/projects/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  return projectResponse(async () => {
    const viewer = await projectViewer(request);
    if (viewer.role !== "NATIONAL_ADMIN")
      authorizeProject(viewer, "publish", viewer.chapterId ?? undefined);
    return Response.json(
      await publishProject(viewer, (await context.params).projectId)
    );
  });
}
