import { describe, expect, it } from "vitest";
import type { AppRole } from "@/types";
import {
  DIRECTORY_ADMIN_ROLES,
  canAssignUserRole,
  isDirectoryAdmin,
} from "./roles";

describe("DIRECTORY_ADMIN_ROLES", () => {
  it("is Nationals only", () => {
    expect([...DIRECTORY_ADMIN_ROLES]).toEqual(["NATIONAL_ADMIN"]);
    expect(isDirectoryAdmin("NATIONAL_ADMIN")).toBe(true);
    expect(isDirectoryAdmin("MEMBER")).toBe(false);
    expect(isDirectoryAdmin("CHAPTER_LEAD")).toBe(false);
    expect(isDirectoryAdmin("PROJECT_LEAD")).toBe(false);
  });
});

describe("canAssignUserRole", () => {
  const nationals = {
    actorRole: "NATIONAL_ADMIN" as const,
    actorUserId: "nat",
  };

  it("lets Nationals promote a member", () => {
    expect(
      canAssignUserRole({
        ...nationals,
        targetUserId: "u1",
        targetCurrentRole: "MEMBER",
        nextRole: "CHAPTER_LEAD",
      })
    ).toBe(true);
  });

  it("lets Nationals demote another admin", () => {
    expect(
      canAssignUserRole({
        ...nationals,
        targetUserId: "u1",
        targetCurrentRole: "NATIONAL_ADMIN",
        nextRole: "MEMBER",
      })
    ).toBe(true);
  });

  it("blocks self-changes and no-ops", () => {
    expect(
      canAssignUserRole({
        ...nationals,
        targetUserId: "nat",
        targetCurrentRole: "NATIONAL_ADMIN",
        nextRole: "MEMBER",
      })
    ).toBe(false);
    expect(
      canAssignUserRole({
        ...nationals,
        targetUserId: "u1",
        targetCurrentRole: "MEMBER",
        nextRole: "MEMBER",
      })
    ).toBe(false);
  });

  it("blocks non-directory-admins", () => {
    for (const actorRole of [
      "CHAPTER_LEAD",
      "PROJECT_LEAD",
      "MEMBER",
    ] as const) {
      expect(
        canAssignUserRole({
          actorRole,
          actorUserId: "x",
          targetUserId: "u1",
          targetCurrentRole: "MEMBER",
          nextRole: "CHAPTER_LEAD",
        })
      ).toBe(false);
    }
  });

  it("rejects a role that does not exist", () => {
    expect(
      canAssignUserRole({
        ...nationals,
        targetUserId: "u1",
        targetCurrentRole: "MEMBER",
        nextRole: "COD" as AppRole,
      })
    ).toBe(false);
  });
});
