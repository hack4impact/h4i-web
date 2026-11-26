import { projectListQuery } from "@/lib/projects/sort";
import { hasRole, ADMIN_ROLES, EDITOR_ROLES } from "@/lib/auth/roles";
import {
  authorizeProject,
  projectResponse,
  projectViewer,
  ProjectApiError,
} from "@/lib/projects/http";
import {
  createProject,
  listProjects,
  parseProjectBody,
} from "@/lib/projects/service";

export async function GET(request: Request) {
  return projectResponse(async () => {
    const viewer = await projectViewer(request);
    const params = new URL(request.url).searchParams;
    const query = projectListQuery.safeParse(Object.fromEntries(params));
    if (!query.success)
      throw new ProjectApiError(400, "Invalid project sort or chapter");
    return Response.json(
      await listProjects(viewer, params.get("include_drafts") === "true", {
        sort: query.data.sort,
        chapterId: query.data.chapter_id,
      })
    );
  });
}
export async function POST(request: Request) {
  return projectResponse(async () => {
    const viewer = await projectViewer(request, EDITOR_ROLES);
    if (!hasRole(viewer.role, ADMIN_ROLES))
      authorizeProject(viewer, "create", viewer.chapterId ?? undefined);
    return Response.json(
      await createProject(viewer, await parseProjectBody(request, true)),
      { status: 201 }
    );
  });
}
