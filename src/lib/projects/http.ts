import { Prisma } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth/session";
import {
  canProjectAction,
  type ProjectAction,
  type ProjectViewer,
} from "./permissions";

export class ProjectApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}
export async function projectViewer(request: Request): Promise<ProjectViewer> {
  const session = await getSessionFromRequest(request);
  if (!session) throw new ProjectApiError(401, "Unauthorized");
  const { id, role, chapterId } = session.user;
  return { id, role, chapterId };
}
export function authorizeProject(
  viewer: ProjectViewer,
  action: ProjectAction,
  chapterId?: string
) {
  if (!canProjectAction(viewer, action, chapterId))
    throw new ProjectApiError(403, "Forbidden");
}
export async function projectResponse(
  work: () => Promise<Response>
): Promise<Response> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof ProjectApiError)
      return Response.json(
        {
          error: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
        { status: error.status }
      );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2003", "P2025"].includes(error.code)
    )
      return Response.json(
        { error: "A referenced record changed. Reload and try again." },
        { status: 409 }
      );
    console.error("Project API failed", error);
    return Response.json({ error: "Project request failed" }, { status: 500 });
  }
}
