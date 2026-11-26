import { hasRole, ADMIN_ROLES, EDITOR_ROLES } from "@/lib/auth/roles";
import {
  authorizeProject,
  projectResponse,
  projectViewer,
} from "@/lib/projects/http";
import {
  deleteProject,
  parseProjectBody,
  patchProject,
  readProject,
} from "@/lib/projects/service";

type Context = { params: Promise<{ projectId: string }> };
export async function GET(request: Request, context: Context) {
  return projectResponse(async () => {
    const viewer = await projectViewer(request);
    return Response.json(
      await readProject(
        viewer,
        (await context.params).projectId,
        new URL(request.url).searchParams.get("draft") === "true"
      )
    );
  });
}
export async function PATCH(request: Request, context: Context) {
  return projectResponse(async () => {
    const viewer = await projectViewer(request, EDITOR_ROLES);
    if (!hasRole(viewer.role, ADMIN_ROLES))
      authorizeProject(viewer, "edit", viewer.chapterId ?? undefined);
    return Response.json(
      await patchProject(
        viewer,
        (await context.params).projectId,
        await parseProjectBody(request)
      )
    );
  });
}
export async function DELETE(request: Request, context: Context) {
  return projectResponse(async () => {
    const viewer = await projectViewer(request, ADMIN_ROLES);
    await deleteProject(viewer, (await context.params).projectId);
    return new Response(null, { status: 204 });
  });
}
