import { EDITOR_ROLES } from "@/lib/auth/roles";
import {
  projectResponse,
  projectViewer,
  ProjectApiError,
} from "@/lib/projects/http";
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
    const file = await uploadedFile(request);
    if (
      new URL(request.url).searchParams.get("purpose") === "partner-photo" &&
      !file.type.startsWith("image/")
    )
      throw new ProjectApiError(400, "Partner photos must be images");
    return Response.json(await storeMedia(projectId, file), { status: 201 });
  });
}
