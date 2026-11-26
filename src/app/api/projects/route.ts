import { projectListQuery, projectListOptions } from "@/lib/projects/sort";
import { hasRole, ADMIN_ROLES, EDITOR_ROLES } from "@/lib/auth/roles";
import {
  authorizeProject,
  projectResponse,
  projectViewer,
  ProjectApiError,
} from "@/lib/projects/http";
import {
  createProject,
  searchProjects,
  parseProjectBody,
} from "@/lib/projects/service";

export async function GET(request: Request) {
  return projectResponse(async () => {
    const viewer = await projectViewer(request);
    const params = new URL(request.url).searchParams;
    const query = projectListQuery.safeParse(Object.fromEntries(params));
    if (!query.success)
      throw new ProjectApiError(
        400,
        "Invalid project search, filters or pagination"
      );
    const results = await searchProjects(
      viewer,
      params.get("include_drafts") === "true",
      projectListOptions(query.data)
    );
    return Response.json(results.items, {
      headers: {
        "X-Total-Count": String(results.total),
        "X-Page": String(results.page),
        "X-Page-Size": String(results.pageSize),
        "X-Total-Pages": String(results.pages),
        "Cache-Control": "private, no-store",
      },
    });
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
