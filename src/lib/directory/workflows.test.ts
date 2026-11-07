import { describe, expect, it } from "vitest";
import { canRunMemberToAlumniTransition } from "./workflows";
import { hasDuplicateActiveDirectoryIdentities } from "./visibility";

describe("canRunMemberToAlumniTransition", () => {
  it("allows directory admins (NATIONAL_ADMIN)", () => {
    expect(
      canRunMemberToAlumniTransition({
        actor: { userId: "admin", role: "NATIONAL_ADMIN" },
        memberUserId: "owner",
      })
    ).toBe(true);
    expect(
      canRunMemberToAlumniTransition({
        actor: { userId: "admin", role: "NATIONAL_ADMIN" },
        memberUserId: null,
      })
    ).toBe(true);
  });

  it("allows the profile owner and rejects other volunteers", () => {
    expect(
      canRunMemberToAlumniTransition({
        actor: { userId: "owner", role: "MEMBER" },
        memberUserId: "owner",
      })
    ).toBe(true);
    expect(
      canRunMemberToAlumniTransition({
        actor: { userId: "other", role: "MEMBER" },
        memberUserId: "owner",
      })
    ).toBe(false);
    expect(
      canRunMemberToAlumniTransition({
        actor: { userId: "other", role: "CHAPTER_LEAD" },
        memberUserId: "owner",
      })
    ).toBe(false);
  });
});

describe("transition dual-visibility invariant", () => {
  const visible = {
    userId: "u1",
    approvalStatus: "APPROVED" as const,
    directoryOptIn: true,
    adminHidden: false,
  };

  it("flags when both sides would be member-facing visible", () => {
    expect(hasDuplicateActiveDirectoryIdentities(visible, visible)).toBe(true);
  });

  it("allows alumni visible after member is soft-retired (opted out)", () => {
    expect(
      hasDuplicateActiveDirectoryIdentities(
        { ...visible, directoryOptIn: false },
        visible
      )
    ).toBe(false);
  });
});
