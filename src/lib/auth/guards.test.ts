import { describe, expect, it } from "vitest";
import {
  COD_ROLES,
  DIRECTORY_ADMIN_ROLES,
  EDITOR_ROLES,
  NATIONALS_ROLES,
} from "./roles";

describe("role allow-lists", () => {
  it("preserves Notion editor shape with NATIONALS instead of ADMIN", () => {
    expect(EDITOR_ROLES).toEqual(["NATIONALS", "CHAPTER_LEAD", "PROJECT_LEAD"]);
    expect(EDITOR_ROLES).not.toContain("COD");
    expect(EDITOR_ROLES).not.toContain("ADMIN");
  });

  it("keeps COD and NATIONALS as peer directory admins", () => {
    expect([...DIRECTORY_ADMIN_ROLES]).toEqual(["COD", "NATIONALS"]);
    expect([...COD_ROLES]).toEqual(["COD"]);
    expect([...NATIONALS_ROLES]).toEqual(["NATIONALS"]);
  });
});
