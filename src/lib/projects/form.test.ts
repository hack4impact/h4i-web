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
