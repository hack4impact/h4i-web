import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { stages } from "./validation";

export const projectSortLabels = {
  last_updated: "Last updated (newest)",
  name: "Name (A–Z)",
  year: "Year (newest)",
} as const;
export const projectLengthLabels = {
  short: "Up to 180 days",
  medium: "181–365 days",
  long: "Over 365 days",
  unknown: "Length not set",
} as const;
const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && !value.trim() ? undefined : value),
    z.string().trim().min(1).max(max).optional()
  );
const optionalEnum = <const T extends readonly [string, ...string[]]>(
  values: T
) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(values).optional()
  );
export const projectListQuery = z.object({
  sort: z.enum(["last_updated", "name", "year"]).default("last_updated"),
  chapter_id: optionalText(200),
  q: optionalText(200),
  stage: optionalEnum(stages),
  project_length: optionalEnum(["short", "medium", "long", "unknown"]),
  impact_area: optionalText(100),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(12),
});
export type ProjectListQuery = z.infer<typeof projectListQuery>;
export type ProjectListOptions = {
  sort?: keyof typeof projectSortLabels;
  chapterId?: string;
  q?: string;
  stage?: ProjectListQuery["stage"];
  projectLength?: keyof typeof projectLengthLabels;
  impactArea?: string;
  page?: number;
  pageSize?: number;
};
export function projectListOptions(
  query: ProjectListQuery
): ProjectListOptions {
  return {
    sort: query.sort,
    chapterId: query.chapter_id,
    q: query.q,
    stage: query.stage,
    projectLength: query.project_length,
    impactArea: query.impact_area,
    page: query.page,
    pageSize: query.page_size,
  };
}
export function projectsUrl(query: Partial<ProjectListQuery>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "" || (key === "page" && value === 1))
      continue;
    params.set(key, String(value));
  }
  return `/projects${params.size ? `?${params}` : ""}`;
}
export function projectOrderBy(
  sort: ProjectListOptions["sort"]
): Prisma.ProjectOrderByWithRelationInput[] {
  if (sort === "name") return [{ name: "asc" }, { id: "asc" }];
  if (sort === "year")
    return [
      { startDate: { sort: "desc", nulls: "last" } },
      { name: "asc" },
      { id: "asc" },
    ];
  return [{ lastUpdated: { sort: "desc", nulls: "last" } }, { id: "asc" }];
}
