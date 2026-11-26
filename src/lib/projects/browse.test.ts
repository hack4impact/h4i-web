import { describe, expect, it } from "vitest";
import { projectListQuery, projectsUrl } from "./sort";

describe("shareable project filter URLs", () => {
  it("removes one chip while preserving other filters and sort", () => {
    const query = projectListQuery.parse({
      q: "Food & care",
      chapter_id: "cornell",
      stage: "development",
      impact_area: "Health",
      project_length: "short",
      sort: "name",
      page: 3,
    });
    const url = projectsUrl({ ...query, stage: undefined, page: 1 });
    const params = new URL(url, "http://localhost").searchParams;
    expect(params.get("q")).toBe("Food & care");
    expect(params.get("chapter_id")).toBe("cornell");
    expect(params.get("sort")).toBe("name");
    expect(params.has("stage")).toBe(false);
    expect(params.has("page")).toBe(false);
    expect(params.get("project_length")).toBe("short");
  });
  it("normalizes blank controls without treating blank numeric parameters as valid pages", () => {
    expect(
      projectListQuery.parse({
        q: "   ",
        stage: "",
        project_length: "",
        chapter_id: "",
        impact_area: "",
      })
    ).toEqual({ sort: "last_updated", page: 1, page_size: 12 });
    expect(projectListQuery.safeParse({ page: "" }).success).toBe(false);
  });
});
