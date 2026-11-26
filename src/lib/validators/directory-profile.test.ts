import { describe, expect, it } from "vitest";
import {
  directoryProfileFieldsSchema,
  graduationYearSchema,
  normalizeTagList,
  safeHttpUrlSchema,
} from "./directory-profile";

describe("directory profile validators", () => {
  it("allows incomplete profiles (all fields optional)", () => {
    expect(directoryProfileFieldsSchema.parse({})).toEqual({});
  });

  it("accepts shared contact fields including alumni Instagram", () => {
    const parsed = directoryProfileFieldsSchema.parse({
      displayName: "Alex Alumni",
      contactEmail: "alex@example.com",
      linkedInUrl: "https://linkedin.com/in/alex",
      githubUrl: "https://github.com/alex",
      websiteUrl: "https://alex.example",
      instagramUrl: "https://instagram.com/alex",
      graduationYear: 2024,
      major: "Computer Science",
      location: "Ithaca, NY",
      skills: ["TypeScript", "typescript", "  React  ", ""],
      interests: ["Civic tech"],
      bio: "Building for nonprofits.",
      position: "DEVELOPER",
      directoryOptIn: true,
    });
    expect(parsed.instagramUrl).toBe("https://instagram.com/alex");
    expect(parsed.skills).toEqual(["TypeScript", "React"]);
  });

  it("rejects out-of-range graduation years and empty strings", () => {
    expect(() => graduationYearSchema.parse(1800)).toThrow();
    expect(() => graduationYearSchema.parse(2100)).toThrow();
    expect(() =>
      directoryProfileFieldsSchema.parse({ displayName: "   " })
    ).toThrow();
  });

  it("rejects unsafe URL schemes", () => {
    expect(() => safeHttpUrlSchema.parse("javascript:alert(1)")).toThrow();
    expect(() => safeHttpUrlSchema.parse("data:text/html,hi")).toThrow();
    expect(() => safeHttpUrlSchema.parse("ftp://example.com")).toThrow();
    expect(safeHttpUrlSchema.parse("https://example.com/x")).toBe(
      "https://example.com/x"
    );
  });

  it("dedupes skills/interests case-insensitively", () => {
    expect(normalizeTagList(["Go", "go", " GO ", "", "Rust"])).toEqual([
      "Go",
      "Rust",
    ]);
  });
});
