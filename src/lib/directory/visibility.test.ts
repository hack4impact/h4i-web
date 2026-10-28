import { describe, expect, it } from "vitest";
import {
  hasDuplicateActiveDirectoryIdentities,
  isMemberFacingDirectoryVisible,
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
