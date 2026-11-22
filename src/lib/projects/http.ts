import { Prisma } from "@prisma/client";
import { assertSession, assertRole } from "@/lib/auth/guards";
import type { AppRole } from "@/types";
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
export async function projectViewer(
  request: Request,
  allowed?: readonly AppRole[]
): Promise<ProjectViewer> {
  let session;
  try {
    session = await (allowed
      ? assertRole(allowed, request)
      : assertSession(request));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized")
      throw new ProjectApiError(401, "Unauthorized");
    if (error instanceof Error && error.message === "Forbidden")
      throw new ProjectApiError(403, "Forbidden");
    throw error;
  }
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
