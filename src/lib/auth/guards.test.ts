import { describe, expect, it } from "vitest";
import {
  ADMIN_ROLES,
  CHAPTER_LEADERSHIP_ROLES,
  EDITOR_ROLES,
  canActForChapter,
  hasRole,
} from "./roles";

describe("role allow-lists", () => {
  it("names the four spec roles and nothing else", () => {
    expect(ADMIN_ROLES).toEqual(["NATIONAL_ADMIN"]);
    expect(EDITOR_ROLES).toEqual([
      "NATIONAL_ADMIN",
      "CHAPTER_LEAD",
      "PROJECT_LEAD",
    ]);
    expect(CHAPTER_LEADERSHIP_ROLES).toEqual([
      "NATIONAL_ADMIN",
      "CHAPTER_LEAD",
    ]);
    for (const list of [ADMIN_ROLES, EDITOR_ROLES, CHAPTER_LEADERSHIP_ROLES]) {
      expect(list).not.toContain("ADMIN");
      expect(list).not.toContain("VOLUNTEER");
      expect(list).not.toContain("MEMBER");
    }
  });

  it("hasRole matches against the list only", () => {
    expect(hasRole("MEMBER", EDITOR_ROLES)).toBe(false);
    expect(hasRole("PROJECT_LEAD", EDITOR_ROLES)).toBe(true);
    expect(hasRole("CHAPTER_LEAD", ADMIN_ROLES)).toBe(false);
  });
});

describe("canActForChapter", () => {
  it("lets Nationals act for any chapter", () => {
    expect(
      canActForChapter({ role: "NATIONAL_ADMIN", chapterId: null }, "c1")
    ).toBe(true);
  });

  it("scopes chapter leads to their own chapter", () => {
    expect(
      canActForChapter({ role: "CHAPTER_LEAD", chapterId: "c1" }, "c1")
    ).toBe(true);
    expect(
      canActForChapter({ role: "CHAPTER_LEAD", chapterId: "c1" }, "c2")
    ).toBe(false);
    expect(
      canActForChapter({ role: "CHAPTER_LEAD", chapterId: null }, "c1")
    ).toBe(false);
  });

  it("never grants project leads or members", () => {
    expect(
      canActForChapter({ role: "PROJECT_LEAD", chapterId: "c1" }, "c1")
    ).toBe(false);
    expect(canActForChapter({ role: "MEMBER", chapterId: "c1" }, "c1")).toBe(
      false
    );
  });
});
