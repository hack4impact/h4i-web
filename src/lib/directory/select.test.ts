import { describe, expect, it } from "vitest";
import {
  alumniDetailModerationSelect,
  alumniDetailSelect,
  directoryProfileModerationSelect,
  directoryProfileSelect,
} from "./select";

/**
 * These guard the field allow-list. A column added to Member or Alumni later
 * must be listed deliberately; if someone adds it by spreading the model, the
 * forbidden-key assertions below fail.
 */
const NEVER_SELECTED = [
  "userId",
  "user",
  "chapterId",
  "createdAt",
  "updatedAt",
] as const;

const MODERATION_ONLY = [
  "approvalStatus",
  "directoryOptIn",
  "adminHidden",
] as const;

describe("directoryProfileSelect", () => {
  it("never selects ownership, the User relation, or row bookkeeping", () => {
    for (const key of NEVER_SELECTED) {
      expect(directoryProfileSelect).not.toHaveProperty(key);
    }
  });

  it("withholds moderation state from ordinary viewers", () => {
    for (const key of MODERATION_ONLY) {
      expect(directoryProfileSelect).not.toHaveProperty(key);
    }
  });

  it("exposes chapter as a nested id and name, not a raw foreign key", () => {
    expect(directoryProfileSelect.chapter).toEqual({
      select: { id: true, name: true },
    });
  });

  it("shares contactEmail rather than the private account email", () => {
    expect(directoryProfileSelect.contactEmail).toBe(true);
    expect(directoryProfileSelect).not.toHaveProperty("user");
  });
});

describe("directoryProfileModerationSelect", () => {
  it("adds moderation state and nothing else", () => {
    for (const key of MODERATION_ONLY) {
      expect(directoryProfileModerationSelect).toHaveProperty(key, true);
    }
    expect(Object.keys(directoryProfileModerationSelect).sort()).toEqual(
      [...Object.keys(directoryProfileSelect), ...MODERATION_ONLY].sort()
    );
  });

  it("still never selects ownership or the User relation", () => {
    for (const key of NEVER_SELECTED) {
      expect(directoryProfileModerationSelect).not.toHaveProperty(key);
    }
  });
});

describe("alumni selects", () => {
  it("attach history on top of the shared profile fields", () => {
    expect(alumniDetailSelect).toHaveProperty("jobExperiences");
    expect(alumniDetailSelect).toHaveProperty("hackInvolvements");
    expect(alumniDetailSelect.displayName).toBe(true);
  });

  it("do not leak ownership through the history relations", () => {
    for (const key of NEVER_SELECTED) {
      expect(alumniDetailSelect).not.toHaveProperty(key);
      expect(alumniDetailModerationSelect).not.toHaveProperty(key);
    }
    expect(alumniDetailSelect.jobExperiences.select).not.toHaveProperty(
      "alumniId"
    );
    expect(alumniDetailSelect.hackInvolvements.select).not.toHaveProperty(
      "alumniId"
    );
  });

  it("keep moderation state out of the non-admin detail projection", () => {
    for (const key of MODERATION_ONLY) {
      expect(alumniDetailSelect).not.toHaveProperty(key);
      expect(alumniDetailModerationSelect).toHaveProperty(key, true);
    }
  });
});
