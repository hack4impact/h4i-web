import { describe, expect, it } from "vitest";
import { MAX_SEARCH_LENGTH } from "@/lib/sourced-projects/listing-input";
import {
  hasListingQuery,
  parseListingSearchParams,
} from "@/lib/sourced-projects/listing-search";

describe("parseListingSearchParams", () => {
  it("reads search and every filter", () => {
    expect(
      parseListingSearchParams({
        q: " tutoring ",
        status: "AVAILABLE",
        cause: "EDUCATION",
        chapter: "seed-chapter-uiuc",
      })
    ).toEqual({
      search: "tutoring",
      filter: {
        status: "AVAILABLE",
        causeArea: "EDUCATION",
        sourcingChapterId: "seed-chapter-uiuc",
      },
    });
  });

  it("returns an empty query with no params", () => {
    const query = parseListingSearchParams({});
    expect(query).toEqual({});
    expect(hasListingQuery(query)).toBe(false);
  });

  it("drops unknown enum values and blank params", () => {
    expect(
      parseListingSearchParams({
        status: "DELETED",
        cause: "toString",
        q: "   ",
        chapter: "",
      })
    ).toEqual({});
  });

  it("uses the first value of a repeated param", () => {
    expect(
      parseListingSearchParams({ status: ["CLAIMED", "AVAILABLE"] })
    ).toEqual({ filter: { status: "CLAIMED" } });
  });

  it("caps the search length", () => {
    const query = parseListingSearchParams({ q: "a".repeat(500) });
    expect(query.search).toHaveLength(MAX_SEARCH_LENGTH);
  });
});
