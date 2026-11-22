import { hasRole, ADMIN_ROLES, EDITOR_ROLES } from "@/lib/auth/roles";
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
    const viewer = await projectViewer(request, EDITOR_ROLES);
    if (!hasRole(viewer.role, ADMIN_ROLES))
      authorizeProject(viewer, "publish", viewer.chapterId ?? undefined);
    return Response.json(
      await publishProject(viewer, (await context.params).projectId)
    );
  });
}
