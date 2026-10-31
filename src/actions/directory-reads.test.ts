import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertSession: vi.fn(),
  member: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
  alumni: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
}));

vi.mock("@/lib/db", () => ({
  db: { member: mocks.member, alumni: mocks.alumni },
}));

vi.mock("@/lib/auth/guards", () => ({
  assertSession: mocks.assertSession,
}));

import { getMember, getMyMemberProfile, listMembers } from "./members";
import { getAlumniProfile, listAlumni } from "./alumni";
import { memberFacingDirectoryWhere } from "@/lib/directory/visibility";
import {
  directoryProfileModerationSelect,
  directoryProfileSelect,
} from "@/lib/directory/select";

type Role = "COD" | "NATIONALS" | "CHAPTER_LEAD" | "PROJECT_LEAD" | "VOLUNTEER";

function signedInAs(role: Role, userId = "user_1") {
  mocks.assertSession.mockResolvedValue({ user: { id: userId, role } });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authentication", () => {
  it("every directory read goes through the session guard", async () => {
    mocks.assertSession.mockRejectedValue(new Error("Unauthorized"));

    await expect(listMembers()).rejects.toThrow("Unauthorized");
    await expect(getMember("member_1")).rejects.toThrow("Unauthorized");
    await expect(getMyMemberProfile()).rejects.toThrow("Unauthorized");
    await expect(listAlumni()).rejects.toThrow("Unauthorized");
    await expect(getAlumniProfile("alumni_1")).rejects.toThrow("Unauthorized");

    expect(mocks.member.findMany).not.toHaveBeenCalled();
    expect(mocks.member.findFirst).not.toHaveBeenCalled();
    expect(mocks.alumni.findMany).not.toHaveBeenCalled();
    expect(mocks.alumni.findFirst).not.toHaveBeenCalled();
  });
});

describe("list reads", () => {
  it("filter to member-facing rows and withhold moderation state", async () => {
    signedInAs("VOLUNTEER");
    await listMembers();

    const args = mocks.member.findMany.mock.calls[0][0];
    expect(args.where).toEqual(memberFacingDirectoryWhere);
    expect(args.select).toBe(directoryProfileSelect);
  });

  it("stay member-facing for NATIONALS — a list never exposes unpublished rows", async () => {
    signedInAs("NATIONALS");
    await listMembers();
    await listAlumni();

    expect(mocks.member.findMany.mock.calls[0][0].where).toEqual(
      memberFacingDirectoryWhere
    );
    expect(mocks.alumni.findMany.mock.calls[0][0].where).toEqual(
      memberFacingDirectoryWhere
    );
  });
});

describe("detail reads cannot bypass visibility", () => {
  it("apply the visibility clause inside the query, not after it", async () => {
    signedInAs("VOLUNTEER");
    await getMember("member_1");

    // findFirst with the rule in `where` — never findUnique({ where: { id } }),
    // which would fetch the row first and leave filtering to the caller.
    expect(mocks.member.findUnique).not.toHaveBeenCalled();

    const args = mocks.member.findFirst.mock.calls[0][0];
    expect(args.where).toEqual({
      id: "member_1",
      OR: [memberFacingDirectoryWhere, { userId: "user_1" }],
    });
    expect(args.select).toBe(directoryProfileSelect);
  });

  it("let an owner reach their own row whatever its state", async () => {
    signedInAs("VOLUNTEER", "owner_9");
    await getMember("member_1");

    expect(mocks.member.findFirst.mock.calls[0][0].where.OR).toContainEqual({
      userId: "owner_9",
    });
  });

  it("let NATIONALS reach any row, with moderation state attached", async () => {
    signedInAs("NATIONALS");
    await getMember("member_1");

    const args = mocks.member.findFirst.mock.calls[0][0];
    expect(args.where).toEqual({ id: "member_1" });
    expect(args.select).toBe(directoryProfileModerationSelect);
  });

  it("treat COD, CHAPTER_LEAD and PROJECT_LEAD as ordinary viewers", async () => {
    for (const role of ["COD", "CHAPTER_LEAD", "PROJECT_LEAD"] as const) {
      vi.clearAllMocks();
      signedInAs(role);
      await getMember("member_1");

      const args = mocks.member.findFirst.mock.calls[0][0];
      expect(args.where).toEqual({
        id: "member_1",
        OR: [memberFacingDirectoryWhere, { userId: "user_1" }],
      });
      expect(args.select).toBe(directoryProfileSelect);
    }
  });

  it("apply the same rule to alumni detail", async () => {
    signedInAs("VOLUNTEER");
    await getAlumniProfile("alumni_1");

    expect(mocks.alumni.findUnique).not.toHaveBeenCalled();
    expect(mocks.alumni.findFirst.mock.calls[0][0].where).toEqual({
      id: "alumni_1",
      OR: [memberFacingDirectoryWhere, { userId: "user_1" }],
    });
  });

  it("return null for an empty id without querying", async () => {
    signedInAs("VOLUNTEER");

    expect(await getMember("")).toBeNull();
    expect(await getAlumniProfile("")).toBeNull();
    expect(mocks.member.findFirst).not.toHaveBeenCalled();
    expect(mocks.alumni.findFirst).not.toHaveBeenCalled();
  });

  it("report missing and hidden identically, so 404 cannot be told from 403", async () => {
    signedInAs("VOLUNTEER");
    mocks.member.findFirst.mockResolvedValue(null);

    expect(await getMember("does_not_exist")).toBeNull();
    expect(await getMember("hidden_but_real")).toBeNull();
  });
});

describe("owner path", () => {
  it("looks the viewer up by their own user id and includes moderation state", async () => {
    signedInAs("VOLUNTEER", "owner_9");
    await getMyMemberProfile();

    const args = mocks.member.findUnique.mock.calls[0][0];
    expect(args.where).toEqual({ userId: "owner_9" });
    expect(args.select).toBe(directoryProfileModerationSelect);
  });
});
