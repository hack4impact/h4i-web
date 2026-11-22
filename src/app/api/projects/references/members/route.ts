import { z } from "zod";
import { EDITOR_ROLES } from "@/lib/auth/roles";
import {
  projectResponse,
  projectViewer,
  ProjectApiError,
} from "@/lib/projects/http";
import { searchMemberReferences } from "@/lib/projects/references";

export async function GET(request: Request) {
  return projectResponse(async () => {
    await projectViewer(request, EDITOR_ROLES);
    const query = z
      .string()
      .trim()
      .max(100)
      .safeParse(new URL(request.url).searchParams.get("q") || "");
    if (!query.success)
      throw new ProjectApiError(400, "Search must be at most 100 characters");
    return Response.json({ members: await searchMemberReferences(query.data) });
  });
}
