import { describe, expect, it } from "vitest";
import {
  canProjectAction,
  type ProjectAction,
  type ProjectViewer,
} from "./permissions";

// Section 14: each row is asserted for every supported role and chapter scope.
const table: {
  action: ProjectAction;
  member: boolean;
  ownLead: boolean;
  otherLead: boolean;
  admin: boolean;
}[] = [
  {
    action: "browse",
    member: true,
    ownLead: true,
    otherLead: true,
    admin: true,
  },
  { action: "read", member: true, ownLead: true, otherLead: true, admin: true },
  {
    action: "readDraft",
    member: false,
    ownLead: true,
    otherLead: false,
    admin: true,
  },
  {
    action: "create",
    member: false,
    ownLead: true,
    otherLead: false,
    admin: true,
  },
  {
    action: "edit",
    member: false,
    ownLead: true,
    otherLead: false,
    admin: true,
  },
  {
    action: "publish",
    member: false,
    ownLead: true,
    otherLead: false,
    admin: true,
  },
  // Lead deletion was left open in the PRD; default to National Admin only.
  {
    action: "delete",
    member: false,
    ownLead: false,
    otherLead: false,
    admin: true,
  },
];
describe("Section 14 project permissions", () => {
  it.each(table)("$action", ({ action, member, ownLead, otherLead, admin }) => {
    const viewer = (
      role: ProjectViewer["role"],
      chapterId: string | null
    ): ProjectViewer => ({ id: "user", role, chapterId });
    expect(canProjectAction(viewer("MEMBER", "c1"), action, "c1")).toBe(member);
    expect(canProjectAction(viewer("NATIONAL_ADMIN", null), action, "c1")).toBe(
      admin
    );
    expect(canProjectAction(viewer("NATIONAL_ADMIN", "c2"), action, "c1")).toBe(
      admin
    );
    for (const role of ["PROJECT_LEAD", "CHAPTER_LEAD"] as const) {
      expect(canProjectAction(viewer(role, "c1"), action, "c1")).toBe(ownLead);
      expect(canProjectAction(viewer(role, "c2"), action, "c1")).toBe(
        otherLead
      );
      expect(canProjectAction(viewer(role, null), action, "c1")).toBe(
        action === "browse" || action === "read"
      );
    }
  });
});
