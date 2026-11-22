import { z } from "zod";
import { EDITOR_ROLES } from "@/lib/auth/roles";
import {
  projectResponse,
  projectViewer,
  ProjectApiError,
} from "@/lib/projects/http";
import { getPartnerReferences } from "@/lib/notion/api";

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
    if (!process.env.NOTION_API_KEY)
      return Response.json({ partners: [], available: false });
    try {
      const partners = await getPartnerReferences();
      return Response.json({
        partners: partners
          .filter((partner) =>
            partner.name
              .toLocaleLowerCase()
              .includes(query.data.toLocaleLowerCase())
          )
          .slice(0, 20),
        available: true,
      });
    } catch {
      return Response.json({ partners: [], available: false });
    }
  });
}
