import { describe, expect, it } from "vitest";
import {
  DIRECTORY_SEARCH_DEFAULT_PAGE_SIZE,
  DIRECTORY_SEARCH_MAX_PAGE,
  DIRECTORY_SEARCH_MAX_PAGE_SIZE,
  parseDirectorySearchParams,
  serializeDirectorySearchParams,
} from "./directory-search";

describe("parseDirectorySearchParams", () => {
  it("applies defaults for empty input", () => {
    expect(parseDirectorySearchParams(undefined)).toEqual({
      q: undefined,
      chapterId: undefined,
      position: undefined,
      graduationYear: undefined,
      kind: "all",
      sort: "name",
      order: "asc",
      page: 1,
      pageSize: DIRECTORY_SEARCH_DEFAULT_PAGE_SIZE,
    });
  });

  it("trims keyword search and drops empty/whitespace-only q", () => {
    expect(parseDirectorySearchParams({ q: "  civic tech  " }).q).toBe(
      "civic tech"
    );
    expect(parseDirectorySearchParams({ q: "   " }).q).toBeUndefined();
    expect(parseDirectorySearchParams({ q: "" }).q).toBeUndefined();
  });

  it("ignores invalid chapter, position, year, sort, and kind values", () => {
    const parsed = parseDirectorySearchParams({
      chapterId: "not-a-cuid",
      position: "ADMIN",
      graduationYear: "1800",
      kind: "staff",
      sort: "email",
      order: "sideways",
    });
    expect(parsed.chapterId).toBeUndefined();
    expect(parsed.position).toBeUndefined();
    expect(parsed.graduationYear).toBeUndefined();
    expect(parsed.kind).toBe("all");
    expect(parsed.sort).toBe("name");
    expect(parsed.order).toBe("asc");
  });

  it("accepts valid filters including organizational roles (not auth roles)", () => {
    const validCuid = "cjld2cjxh0000qzrmn831i7rn";
    const parsed = parseDirectorySearchParams({
      chapterId: validCuid,
      position: "DEVELOPER",
      graduationYear: "2024",
      kind: "alumni",
      sort: "graduationYear",
      order: "desc",
    });
    expect(parsed.chapterId).toBe(validCuid);
    expect(parsed.position).toBe("DEVELOPER");
    expect(parsed.graduationYear).toBe(2024);
    expect(parsed.kind).toBe("alumni");
    expect(parsed.sort).toBe("graduationYear");
    expect(parsed.order).toBe("desc");
    // Auth roles must not be treated as directory positions
    expect(
      parseDirectorySearchParams({ position: "NATIONALS" }).position
    ).toBeUndefined();
    expect(
      parseDirectorySearchParams({ position: "COD" }).position
    ).toBeUndefined();
  });

  it("uses the first value when a parameter is repeated", () => {
    expect(
      parseDirectorySearchParams({ kind: ["member", "alumni"] }).kind
    ).toBe("member");
    expect(parseDirectorySearchParams({ q: ["alpha", "beta"] }).q).toBe(
      "alpha"
    );
  });

  it("clamps pagination: invalid → defaults, excessive page/pageSize → max", () => {
    expect(
      parseDirectorySearchParams({ page: "0", pageSize: "-3" })
    ).toMatchObject({
      page: 1,
      pageSize: DIRECTORY_SEARCH_DEFAULT_PAGE_SIZE,
    });
    expect(
      parseDirectorySearchParams({ page: "abc", pageSize: "999" })
    ).toMatchObject({
      page: 1,
      pageSize: DIRECTORY_SEARCH_MAX_PAGE_SIZE,
    });
    expect(
      parseDirectorySearchParams({ page: "3", pageSize: "10" })
    ).toMatchObject({ page: 3, pageSize: 10 });
    expect(
      parseDirectorySearchParams({ page: "999999999999", pageSize: "1e9" })
    ).toMatchObject({
      page: DIRECTORY_SEARCH_MAX_PAGE,
      pageSize: DIRECTORY_SEARCH_DEFAULT_PAGE_SIZE,
    });
  });

  it("reads from URLSearchParams the same way", () => {
    const sp = new URLSearchParams(
      "q=design&position=DESIGNER&page=2&kind=member"
    );
    const parsed = parseDirectorySearchParams(sp);
    expect(parsed.q).toBe("design");
    expect(parsed.position).toBe("DESIGNER");
    expect(parsed.page).toBe(2);
    expect(parsed.kind).toBe("member");
  });
});

describe("serializeDirectorySearchParams", () => {
  it("omits default values and resets cleanly for navigation", () => {
    const qs = serializeDirectorySearchParams({
      kind: "all",
      sort: "name",
      order: "asc",
      page: 1,
      pageSize: DIRECTORY_SEARCH_DEFAULT_PAGE_SIZE,
      q: "react",
      position: "PM",
    });
    expect(qs).toContain("q=react");
    expect(qs).toContain("position=PM");
    expect(qs).not.toContain("kind=");
    expect(qs).not.toContain("page=");
  });

  it("includes page when > 1 so pagination state survives navigation", () => {
    const qs = serializeDirectorySearchParams({
      kind: "alumni",
      sort: "name",
      order: "asc",
      page: 4,
      pageSize: DIRECTORY_SEARCH_DEFAULT_PAGE_SIZE,
    });
    expect(qs).toContain("page=4");
    expect(qs).toContain("kind=alumni");
  });

  it("preserves non-default pageSize and omits page on filter-only serialize", () => {
    const qs = serializeDirectorySearchParams({
      kind: "member",
      sort: "graduationYear",
      order: "desc",
      page: 1,
      pageSize: 40,
      q: "design",
      chapterId: "cjld2cjxh0000qzrmn831i7rn",
    });
    expect(qs).toContain("pageSize=40");
    expect(qs).toContain("sort=graduationYear");
    expect(qs).toContain("order=desc");
    expect(qs).toContain("kind=member");
    expect(qs).toContain("chapterId=");
    expect(qs).not.toContain("page=");
  });
});
