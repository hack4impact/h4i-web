import { describe, expect, it } from "vitest";
import { COD_ROLES, EDITOR_ROLES, NATIONALS_ROLES } from "./guards";

describe("role allow-lists", () => {
  it("preserves base-branch editor shape with NATIONALS instead of ADMIN", () => {
    expect(EDITOR_ROLES).toEqual(["NATIONALS", "CHAPTER_LEAD", "PROJECT_LEAD"]);
    expect(EDITOR_ROLES).not.toContain("COD");
    expect(EDITOR_ROLES).not.toContain("ADMIN");
  });

  it("keeps COD and NATIONALS as distinct allow-lists", () => {
    expect([...COD_ROLES]).toEqual(["COD"]);
    expect([...NATIONALS_ROLES]).toEqual(["NATIONALS"]);
  });
});
