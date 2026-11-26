import {
  projectResponse,
  projectViewer,
  ProjectApiError,
} from "@/lib/projects/http";
import { readProject } from "@/lib/projects/service";
import { serveMedia } from "@/lib/projects/media";

export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string; file: string }> }
) {
  return projectResponse(async () => {
    const viewer = await projectViewer(request);
    const { projectId, file } = await context.params;
    const project = await readProject(viewer, projectId);
    const url = `/api/projects/${encodeURIComponent(projectId)}/media/${file}`;
    if (
      !project.demoMedia.includes(url) &&
      project.nonprofitPartnerPhoto !== url
    ) {
      // Scoped editors can preview a just-uploaded file before saving the form.
      try {
        await readProject(viewer, projectId, true);
      } catch {
        throw new ProjectApiError(404, "Media not found");
      }
    }
    return serveMedia(projectId, file, request.headers.get("range"));
  });
}
