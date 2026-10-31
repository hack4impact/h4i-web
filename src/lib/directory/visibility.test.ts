import { describe, expect, it } from "vitest";
import {
  MEMBER_FACING_VISIBILITY,
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

describe("MEMBER_FACING_VISIBILITY single source of truth", () => {
  it("keeps the JS predicate, Prisma where, and search SQL constants aligned", () => {
    expect(memberFacingDirectoryWhere).toEqual({
      userId: { not: null },
      approvalStatus: MEMBER_FACING_VISIBILITY.approvalStatus,
      directoryOptIn: MEMBER_FACING_VISIBILITY.directoryOptIn,
      adminHidden: MEMBER_FACING_VISIBILITY.adminHidden,
    });
    expect(MEMBER_FACING_VISIBILITY).toEqual({
      approvalStatus: "APPROVED",
      directoryOptIn: true,
      adminHidden: false,
    });
    expect(
      isMemberFacingDirectoryVisible({
        userId: "u",
        ...MEMBER_FACING_VISIBILITY,
      })
    ).toBe(true);
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
