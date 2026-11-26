import { describe, expect, it } from "vitest";
import { projectUrl, projectThumbnail } from "./urls";
import { patchSchema } from "./validation";
import { projectListQuery } from "./sort";

describe("archive edge-case input boundaries", () => {
  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "ftp://example.org/file",
    "not-a-url",
  ])("rejects unsafe or malformed resource link %s", (url) => {
    expect(
      patchSchema.safeParse({ resourceLinks: [{ type: "Other", url }] }).success
    ).toBe(false);
    expect(projectUrl(url)).toBeNull();
  });
  it("defines thumbnail fallbacks for missing, video-only and unsafe media", () => {
    expect(projectThumbnail([], null)).toBeNull();
    expect(projectThumbnail(["https://example.org/demo.mp4"], null)).toBeNull();
    expect(
      projectThumbnail(
        ["javascript:bad.png", "https://example.org/demo.png"],
        null
      )
    ).toBe("https://example.org/demo.png");
    expect(
      projectThumbnail([], "/api/projects/project/media/logo.png")
    ).toContain("logo.png");
    expect(projectThumbnail([], "javascript:alert(1)")).toBeNull();
  });
  it("accepts only whitelisted sort values and treats the empty chapter option as all chapters", () => {
    expect(projectListQuery.parse({ chapter_id: "" })).toEqual({
      sort: "last_updated",
      page: 1,
      page_size: 12,
    });
    expect(
      projectListQuery.safeParse({ sort: "name; DROP TABLE projects" }).success
    ).toBe(false);
    for (const sort of ["name", "year", "last_updated"])
      expect(projectListQuery.safeParse({ sort }).success).toBe(true);
  });
});
