import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const querySchema = z.object({
  chapter_id: z.string().trim().min(1).max(200).optional(),
  stage: z
    .enum(["design", "development", "launched", "maintenance"])
    .optional(),
  project_length: z.enum(["short", "medium", "long", "ongoing"]).optional(),
  impact_area: z.string().trim().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(9),
});

async function chapterLabels(ids: string[]) {
  const names = new Map([
    ["seed-chapter-boston", "Boston"],
    ["seed-chapter-chicago", "Chicago"],
    ["seed-chapter-atlanta", "Atlanta"],
  ]);
  if (process.env.NOTION_API_KEY) {
    try {
      const { getChapters } = await import("@/lib/notion/api");
      const { rows } = await getChapters();
      for (const row of rows) {
        const name = row.Name || row.name || row["Chapter Name"];
        if (name) names.set(row.id, name);
      }
    } catch {
      // Browsing projects remains available when the external directory is down.
    }
  }
  return ids
    .map((id) => ({ id, name: names.get(id) || `Chapter ${id}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  if (!parsed.success)
    return Response.json(
      { error: "Invalid project filters", details: parsed.error.flatten() },
      { status: 400 }
    );
  const query = parsed.data;
  const clauses = [Prisma.sql`is_draft = false`];
  if (query.chapter_id)
    clauses.push(Prisma.sql`chapter_id = ${query.chapter_id}`);
  if (query.stage)
    clauses.push(Prisma.sql`stage = ${query.stage}::"ProjectStage"`);
  if (query.impact_area)
    clauses.push(Prisma.sql`${query.impact_area} = ANY(cause_areas)`);
  // Calendar-month boundaries: exactly 3 and exactly 6 months are medium.
  if (query.project_length === "ongoing")
    clauses.push(Prisma.sql`end_date IS NULL`);
  if (query.project_length === "short")
    clauses.push(
      Prisma.sql`end_date >= start_date AND end_date < start_date + INTERVAL '3 months'`
    );
  if (query.project_length === "medium")
    clauses.push(
      Prisma.sql`end_date >= start_date + INTERVAL '3 months' AND end_date <= start_date + INTERVAL '6 months'`
    );
  if (query.project_length === "long")
    clauses.push(Prisma.sql`end_date > start_date + INTERVAL '6 months'`);
  const where = Prisma.join(clauses, " AND ");

  try {
    const result = await db.$transaction(
      async (tx) => {
        const [count] = await tx.$queryRaw<{ total: bigint }[]>(
          Prisma.sql`SELECT count(*) AS total FROM projects WHERE ${where}`
        );
        const total = Number(count.total);
        const totalPages = Math.ceil(total / query.page_size);
        const page = Math.min(query.page, Math.max(totalPages, 1));
        const ids = await tx.$queryRaw<{ id: string }[]>(
          Prisma.sql`SELECT id FROM projects WHERE ${where} ORDER BY created_at DESC, id ASC LIMIT ${query.page_size} OFFSET ${(page - 1) * query.page_size}`
        );
        const projects = await tx.project.findMany({
          where: { id: { in: ids.map(({ id }) => id) } },
          include: {
            teamMembers: {
              include: { user: { select: { id: true, name: true } } },
            },
            resourceLinks: true,
          },
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        });
        // Facets use all published projects so combining filters never hides choices.
        const facets = await tx.project.findMany({
          where: { isDraft: false },
          select: { chapterId: true, causeAreas: true },
        });
        return {
          projects,
          pagination: { page, pageSize: query.page_size, total, totalPages },
          chapterIds: [...new Set(facets.map((p) => p.chapterId))],
          impactAreas: [...new Set(facets.flatMap((p) => p.causeAreas))].sort(),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
    );
    return Response.json({
      projects: result.projects,
      pagination: result.pagination,
      filters: {
        chapters: await chapterLabels(result.chapterIds),
        impactAreas: result.impactAreas,
      },
    });
  } catch (error) {
    console.error("Failed to list projects", error);
    return Response.json(
      { error: "Projects could not be loaded. Please try again." },
      { status: 500 }
    );
  }
}
