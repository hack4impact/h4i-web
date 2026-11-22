import { EDITOR_ROLES } from "@/lib/auth/roles";
import { projectResponse, projectViewer } from "@/lib/projects/http";
import { readProject } from "@/lib/projects/service";
import { storeMedia, uploadedFile } from "@/lib/projects/media";

export const runtime = "nodejs";
export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  return projectResponse(async () => {
    const viewer = await projectViewer(request, EDITOR_ROLES);
    const { projectId } = await context.params;
    await readProject(viewer, projectId, true);
    return Response.json(
      await storeMedia(projectId, await uploadedFile(request)),
      { status: 201 }
    );
  });
}
