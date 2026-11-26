import { describe, expect, it } from "vitest";
import { formValue, formPayload, formErrors } from "./form";
import { stages } from "./validation";

describe("project form payloads", () => {
  it("round trips existing dates, team and links without server metadata", () => {
    const value = formValue({
      name: "Existing",
      chapterId: "c1",
      stage: "maintenance",
      startDate: "2026-01-15T00:00:00.000Z",
      teamMembers: [{ userId: "real-user", role: "Developer" }],
      resourceLinks: [{ type: "GitHub", url: "https://example.org/repo" }],
    });
    expect(value.startDate).toBe("2026-01-15");
    const payload = formPayload(value);
    expect(payload.endDate).toBeNull();
    expect(payload.teamMembers).toEqual([
      { userId: "real-user", role: "Developer" },
    ]);
    expect(payload).not.toHaveProperty("isDraft");
    expect(payload).not.toHaveProperty("id");
  });
  it.each(stages)(
    "allows a partial %s draft with just name and chapter",
    (stage) => {
      expect(
        formErrors(formValue({ name: "Partial", chapterId: "c1", stage }))
      ).toEqual({});
    }
  );
  it("reports invalid URLs on the exact resource row", () => {
    expect(
      formErrors(
        formValue({
          name: "Test",
          chapterId: "c1",
          resourceLinks: [{ type: "GitHub", url: "javascript:alert(1)" }],
        })
      )
    ).toHaveProperty("resourceLinks.0.url");
  });
  it("requires the create minimum and validates the timeline", () => {
    expect(formErrors(formValue())).toHaveProperty("name");
    expect(formErrors(formValue())).toHaveProperty("chapterId");
    expect(
      formErrors(
        formValue({
          name: "Test",
          chapterId: "c1",
          startDate: "2026-05-01",
          endDate: "2026-04-01",
        })
      )
    ).toHaveProperty("endDate");
  });
});

describe("autosave placeholders and section errors", () => {
  it("omits empty UI rows without dropping partially typed team roles", async () => {
    const { autosaveValue } = await import("./form");
    const value = formValue({
      name: "Draft",
      chapterId: "c",
      teamMembers: [
        { userId: "", role: "" },
        { userId: "", role: "Designer" },
      ],
      resourceLinks: [{ type: "GitHub", url: "" }],
    });
    expect(autosaveValue(value).teamMembers).toEqual([
      { userId: "", role: "Designer" },
    ]);
    expect(autosaveValue(value).resourceLinks).toEqual([]);
    expect(formErrors(autosaveValue(value))).toHaveProperty(
      "teamMembers.0.userId"
    );
  });
  it("routes server field errors to the corresponding form section", async () => {
    const { errorSection } = await import("./form");
    expect(errorSection("nonprofitPartner")).toBe(1);
    expect(errorSection("startDate")).toBe(1);
    expect(errorSection("goalStatement")).toBe(2);
    expect(errorSection("teamMembers.0.role")).toBe(3);
    expect(errorSection("solutionDescription")).toBe(4);
    expect(errorSection("resourceLinks.0.url")).toBe(5);
  });
});

it("keeps server and client errors on the correct visible rows after blank placeholders", async () => {
  const { draftFieldPath, draftErrors } = await import("./form");
  const value = formValue({
    name: "Draft",
    chapterId: "c",
    teamMembers: [
      { userId: "", role: "" },
      { userId: "person", role: "" },
    ],
    resourceLinks: [
      { type: "GitHub", url: "" },
      { type: "Other", url: "not a URL" },
    ],
  });
  expect(draftFieldPath(value, "teamMembers.0.role")).toBe(
    "teamMembers.1.role"
  );
  expect(draftErrors(value)).toHaveProperty("resourceLinks.1.url");
  expect(draftErrors(value)).not.toHaveProperty("resourceLinks.0.url");
});
