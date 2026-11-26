import { describe, expect, it } from "vitest";
import {
  createSchema,
  patchSchema,
  normalizeInput,
  missingPublishFields,
  stages,
  type ProjectPatch,
} from "./validation";

const design: ProjectPatch = {
  name: "Community Tools",
  stage: "design",
  tagline: "Helping communities",
  nonprofitPartnerName: "Community Center",
  startDate: "2026-01-15",
  problemStatement: "Manual processes",
  goalStatement: "Reduce paperwork",
  teamMembers: [{ userId: "member-id", role: "Developer" }],
};
describe("stage-dependent publish validation", () => {
  it("publishes a complete design without solution, links, media, tags or end date", () => {
    expect(missingPublishFields(design)).toEqual([]);
  });
  it.each(["development", "launched", "maintenance"] as const)(
    "requires solution and resources at %s",
    (stage) => {
      expect(missingPublishFields({ ...design, stage })).toEqual([
        "solutionDescription",
        "resourceLinks",
      ]);
      expect(
        missingPublishFields({
          ...design,
          stage,
          solutionDescription: "A portal",
          resourceLinks: [{ type: "GitHub", url: "https://example.org/repo" }],
        })
      ).toEqual([]);
    }
  );
  it("returns all missing fields in one result", () => {
    expect(missingPublishFields({ stage: "launched" })).toEqual([
      "name",
      "tagline",
      "nonprofitPartner",
      "startDate",
      "problemStatement",
      "goalStatement",
      "teamMembers",
      "solutionDescription",
      "resourceLinks",
    ]);
  });
  it("accepts a directory partner ID instead of a fallback name", () => {
    expect(
      missingPublishFields({
        ...design,
        nonprofitPartnerName: null,
        nonprofitPartnerId: "partner-1",
      })
    ).toEqual([]);
  });
  it("rejects blank required text and incomplete team roles on publish", () => {
    expect(
      missingPublishFields({
        ...design,
        tagline: "  ",
        teamMembers: [{ userId: "u", role: "" }],
      })
    ).toEqual(["tagline", "teamMembers.0.role"]);
  });
});
describe("autosave format validation", () => {
  it.each(stages)("accepts incomplete %s drafts", (stage) => {
    expect(
      patchSchema.safeParse({
        stage,
        name: "",
        tagline: null,
        startDate: null,
        teamMembers: [],
        resourceLinks: [],
      }).success
    ).toBe(true);
  });
  it("creates a draft with only a name", () => {
    expect(createSchema.safeParse({ name: "New Project" }).success).toBe(true);
    expect(createSchema.safeParse({ name: " " }).success).toBe(false);
  });
  it.each([
    { tagline: "x".repeat(181) },
    { startDate: "2026-02-30" },
    { stage: "draft" },
    { resourceLinks: [{ type: "GitHub", url: "javascript:alert(1)" }] },
    { demoMedia: ["//evil.example/image.png"] },
    { isDraft: false },
    { createdBy: "other-user" },
    { lastUpdated: "2026-01-01" },
    { pendingChanges: {} },
    {
      teamMembers: [
        { userId: "u", role: "Dev" },
        { userId: "u", role: "Dev" },
      ],
    },
  ])("rejects malformed or server-owned fields: %j", (input) => {
    expect(patchSchema.safeParse(input).success).toBe(false);
  });
  it("accepts snake_case input without ambiguous aliases", () => {
    expect(
      patchSchema.parse(
        normalizeInput({
          chapter_id: "c1",
          team_members: [{ user_id: "u", role: "Dev" }],
        })
      )
    ).toEqual({ chapterId: "c1", teamMembers: [{ userId: "u", role: "Dev" }] });
    expect(() => normalizeInput({ chapterId: "c1", chapter_id: "c2" })).toThrow(
      "Duplicate field"
    );
  });
});
