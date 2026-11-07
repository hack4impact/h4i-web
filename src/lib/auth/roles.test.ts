import { describe, expect, it } from "vitest";
import {
  DIRECTORY_ADMIN_ROLES,
  canAssignUserRole,
  isDirectoryAdmin,
} from "./roles";

describe("DIRECTORY_ADMIN_ROLES", () => {
  it("treats COD and NATIONALS as peer directory admins", () => {
    expect([...DIRECTORY_ADMIN_ROLES]).toEqual(["COD", "NATIONALS"]);
    expect(isDirectoryAdmin("COD")).toBe(true);
    expect(isDirectoryAdmin("NATIONALS")).toBe(true);
    expect(isDirectoryAdmin("VOLUNTEER")).toBe(false);
    expect(isDirectoryAdmin("CHAPTER_LEAD")).toBe(false);
  });
});

describe("canAssignUserRole", () => {
  const nationals = {
    actorRole: "NATIONALS" as const,
    actorUserId: "nat",
  };
  const cod = {
    actorRole: "COD" as const,
    actorUserId: "cod",
  };

  it("lets Nationals promote a volunteer to COD", () => {
    expect(
      canAssignUserRole({
        ...nationals,
        targetUserId: "u1",
        targetCurrentRole: "VOLUNTEER",
        nextRole: "COD",
      })
    ).toBe(true);
  });

  it("lets Nationals demote a COD to volunteer", () => {
    expect(
      canAssignUserRole({
        ...nationals,
        targetUserId: "u1",
        targetCurrentRole: "COD",
        nextRole: "VOLUNTEER",
      })
    ).toBe(true);
  });

  it("blocks COD from promoting anyone to COD", () => {
    expect(
      canAssignUserRole({
        ...cod,
        targetUserId: "u1",
        targetCurrentRole: "VOLUNTEER",
        nextRole: "COD",
      })
    ).toBe(false);
  });

  it("blocks COD from demoting or changing a COD", () => {
    expect(
      canAssignUserRole({
        ...cod,
        targetUserId: "u1",
        targetCurrentRole: "COD",
        nextRole: "VOLUNTEER",
      })
    ).toBe(false);
    expect(
      canAssignUserRole({
        ...cod,
        targetUserId: "u1",
        targetCurrentRole: "COD",
        nextRole: "NATIONALS",
      })
    ).toBe(false);
  });

  it("lets COD change non-COD roles (peer directory admin otherwise)", () => {
    expect(
      canAssignUserRole({
        ...cod,
        targetUserId: "u1",
        targetCurrentRole: "VOLUNTEER",
        nextRole: "CHAPTER_LEAD",
      })
    ).toBe(true);
  });

  it("blocks self-changes and no-ops", () => {
    expect(
      canAssignUserRole({
        ...nationals,
        targetUserId: "nat",
        targetCurrentRole: "NATIONALS",
        nextRole: "VOLUNTEER",
      })
    ).toBe(false);
    expect(
      canAssignUserRole({
        ...nationals,
        targetUserId: "u1",
        targetCurrentRole: "VOLUNTEER",
        nextRole: "VOLUNTEER",
      })
    ).toBe(false);
  });

  it("blocks non-directory-admins", () => {
    expect(
      canAssignUserRole({
        actorRole: "VOLUNTEER",
        actorUserId: "v",
        targetUserId: "u1",
        targetCurrentRole: "VOLUNTEER",
        nextRole: "CHAPTER_LEAD",
      })
    ).toBe(false);
  });
});
