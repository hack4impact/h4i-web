import type { Prisma } from "@prisma/client";
import { z } from "zod";

export const projectSortLabels = {
  last_updated: "Last updated (newest)",
  name: "Name (A–Z)",
  year: "Year (newest)",
} as const;
export const projectListQuery = z.object({
  sort: z.enum(["last_updated", "name", "year"]).default("last_updated"),
  chapter_id: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().min(1).max(200).optional()
  ),
});
export type ProjectListOptions = {
  sort?: keyof typeof projectSortLabels;
  chapterId?: string;
};
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
