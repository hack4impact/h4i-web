import { describe, expect, it } from "vitest";
import {
  canViewUnpublishedDirectoryProfiles,
  directoryDetailWhere,
  directoryListWhere,
  hasDuplicateActiveDirectoryIdentities,
  isMemberFacingDirectoryVisible,
  memberFacingDirectoryWhere,
} from "./visibility";

const visibleBase = {
  userId: "user_1",
  approvalStatus: "APPROVED" as const,
  directoryOptIn: true,
  adminHidden: false,
};

describe("isMemberFacingDirectoryVisible", () => {
  it("requires owner, approved, opted in, and not admin-hidden", () => {
    expect(isMemberFacingDirectoryVisible(visibleBase)).toBe(true);
  });

  it("hides unclaimed profiles even if otherwise publishable", () => {
    expect(
      isMemberFacingDirectoryVisible({ ...visibleBase, userId: null })
    ).toBe(false);
  });

  it("hides pending, rejected, opted-out, or admin-hidden profiles", () => {
    expect(
      isMemberFacingDirectoryVisible({
        ...visibleBase,
        approvalStatus: "PENDING",
      })
    ).toBe(false);
    expect(
      isMemberFacingDirectoryVisible({
        ...visibleBase,
        approvalStatus: "REJECTED",
      })
    ).toBe(false);
    expect(
      isMemberFacingDirectoryVisible({
        ...visibleBase,
        directoryOptIn: false,
      })
    ).toBe(false);
    expect(
      isMemberFacingDirectoryVisible({ ...visibleBase, adminHidden: true })
    ).toBe(false);
  });
});

describe("hasDuplicateActiveDirectoryIdentities", () => {
  it("is false when only one side is visible", () => {
    expect(
      hasDuplicateActiveDirectoryIdentities(visibleBase, {
        ...visibleBase,
        directoryOptIn: false,
      })
    ).toBe(false);
  });

  it("detects duplicate active identities without deleting either profile", () => {
    expect(
      hasDuplicateActiveDirectoryIdentities(visibleBase, visibleBase)
    ).toBe(true);
  });
});

describe("canViewUnpublishedDirectoryProfiles", () => {
  it("grants NATIONALS and nobody else", () => {
    expect(canViewUnpublishedDirectoryProfiles("NATIONALS")).toBe(true);
  });

  it("does not leak to the other admin type or to editors", () => {
    for (const role of [
      "COD",
      "CHAPTER_LEAD",
      "PROJECT_LEAD",
      "VOLUNTEER",
    ] as const) {
      expect(canViewUnpublishedDirectoryProfiles(role)).toBe(false);
    }
  });
});

describe("directoryListWhere", () => {
  it("is the member-facing clause", () => {
    expect(directoryListWhere()).toEqual(memberFacingDirectoryWhere);
  });

  it("returns a fresh object so a caller cannot mutate the shared rule", () => {
    const first = directoryListWhere();
    (first as Record<string, unknown>).adminHidden = true;
    expect(directoryListWhere().adminHidden).toBe(false);
    expect(memberFacingDirectoryWhere.adminHidden).toBe(false);
  });
});

describe("directoryDetailWhere", () => {
  it("places no restriction on NATIONALS", () => {
    expect(
      directoryDetailWhere({ userId: "user_1", role: "NATIONALS" })
    ).toEqual({});
  });

  it("gives everyone else member-facing rows or their own row", () => {
    expect(
      directoryDetailWhere({ userId: "user_1", role: "VOLUNTEER" })
    ).toEqual({
      OR: [memberFacingDirectoryWhere, { userId: "user_1" }],
    });
  });

  it("treats COD, CHAPTER_LEAD and PROJECT_LEAD as ordinary viewers", () => {
    for (const role of ["COD", "CHAPTER_LEAD", "PROJECT_LEAD"] as const) {
      const where = directoryDetailWhere({ userId: "user_1", role });
      expect(where).not.toEqual({});
      expect(where).toEqual({
        OR: [memberFacingDirectoryWhere, { userId: "user_1" }],
      });
    }
  });

  it("omits the owner branch when there is no viewer id, so unclaimed rows stay hidden", () => {
    expect(directoryDetailWhere({ userId: "", role: "VOLUNTEER" })).toEqual({
      OR: [memberFacingDirectoryWhere],
    });
  });
});
