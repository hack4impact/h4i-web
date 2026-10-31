import { describe, expect, it } from "vitest";
import { memberFacingDirectoryWhere } from "@/lib/directory/visibility";
import {
  buildDirectoryProfileWhere,
  clampDirectorySearchPage,
} from "./search-where";
import {
  DIRECTORY_SEARCH_DEFAULT_PAGE_SIZE,
  parseDirectorySearchParams,
} from "@/lib/validators/directory-search";

describe("buildDirectoryProfileWhere", () => {
  it("always includes the authoritative member-facing visibility predicate", () => {
    const where = buildDirectoryProfileWhere({});
    expect(where).toMatchObject(memberFacingDirectoryWhere);
  });

  it("ANDs chapter, organizational position, and graduation year filters", () => {
    const where = buildDirectoryProfileWhere({
      chapterId: "cjld2cjxh0000qzrmn831i7rn",
      position: "TL",
      graduationYear: 2025,
    });
    expect(where).toEqual({
      AND: [
        memberFacingDirectoryWhere,
        { chapterId: "cjld2cjxh0000qzrmn831i7rn" },
        { position: "TL" },
        { graduationYear: 2025 },
      ],
    });
  });

  it("ANDs keyword OR-clauses across name, bio, interests, and skills fields", () => {
    const where = buildDirectoryProfileWhere({ q: "civic" });
    expect(where).toEqual({
      AND: [
        memberFacingDirectoryWhere,
        {
          OR: [
            { displayName: { contains: "civic", mode: "insensitive" } },
            { bio: { contains: "civic", mode: "insensitive" } },
            { major: { contains: "civic", mode: "insensitive" } },
            { location: { contains: "civic", mode: "insensitive" } },
            { contactEmail: { contains: "civic", mode: "insensitive" } },
            { skills: { has: "civic" } },
            { interests: { has: "civic" } },
          ],
        },
      ],
    });
  });

  it("combines keyword and filters with AND (not OR)", () => {
    const where = buildDirectoryProfileWhere({
      q: "react",
      position: "DEVELOPER",
      graduationYear: 2024,
    });
    expect(where).toHaveProperty("AND");
    const and = (where as { AND: unknown[] }).AND;
    expect(and).toHaveLength(4);
    expect(and[0]).toEqual(memberFacingDirectoryWhere);
    expect(and[1]).toEqual({ position: "DEVELOPER" });
    expect(and[2]).toEqual({ graduationYear: 2024 });
    expect(and[3]).toMatchObject({
      OR: expect.arrayContaining([
        { displayName: { contains: "react", mode: "insensitive" } },
        { skills: { has: "react" } },
      ]),
    });
  });

  it("encodes each visibility exclusion so excluded profiles cannot match", () => {
    // The shared predicate requires owner + APPROVED + opted-in + not hidden.
    // Any failure of these fields fails the AND and must not inflate counts.
    expect(memberFacingDirectoryWhere).toEqual({
      userId: { not: null },
      approvalStatus: "APPROVED",
      directoryOptIn: true,
      adminHidden: false,
    });
    const where = buildDirectoryProfileWhere({ q: "Hidden" });
    expect(where).toMatchObject({
      AND: expect.arrayContaining([memberFacingDirectoryWhere]),
    });
  });
});

describe("clampDirectorySearchPage", () => {
  it("handles empty results and out-of-range pages for UI links", () => {
    expect(clampDirectorySearchPage(5, 0)).toBe(1);
    expect(clampDirectorySearchPage(0, 3)).toBe(1);
    expect(clampDirectorySearchPage(9, 3)).toBe(3);
    expect(clampDirectorySearchPage(2, 3)).toBe(2);
  });
});

describe("directory search param + sort contract", () => {
  it("defaults to deterministic name/asc sorting with page size bounds", () => {
    const params = parseDirectorySearchParams({});
    expect(params.sort).toBe("name");
    expect(params.order).toBe("asc");
    expect(params.pageSize).toBe(DIRECTORY_SEARCH_DEFAULT_PAGE_SIZE);
  });

  it("documents unique tie-breakers: kind then id accompany the primary sort", () => {
    // searchDirectoryProfiles ORDER BY is:
    //   displayName|graduationYear <dir> NULLS LAST, kind ASC, id <dir>
    // NULLS LAST keeps nullable years/names stable in both directions; kind ASC
    // separates member/alumni rows that share a name or year; id breaks ties.
    const params = parseDirectorySearchParams({
      sort: "graduationYear",
      order: "desc",
      page: "2",
      pageSize: "20",
    });
    expect(params).toMatchObject({
      sort: "graduationYear",
      order: "desc",
      page: 2,
      pageSize: 20,
    });
  });
});

describe("out-of-range page UI helper", () => {
  it("maps oversized pages onto the last valid page for navigation", () => {
    expect(clampDirectorySearchPage(999, 3)).toBe(3);
    expect(clampDirectorySearchPage(1, 3)).toBe(1);
  });
});
