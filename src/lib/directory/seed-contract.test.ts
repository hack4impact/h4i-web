import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Locks the development seed contract without touching a database:
 * reruns must be idempotent via upserts / stable emails, scoped cleanup,
 * production guards, and ≥50 visible profiles across ≥3 chapters.
 */
describe("directory development seed contract", () => {
  const source = readFileSync(
    path.join(process.cwd(), "prisma/seed-directory.ts"),
    "utf8"
  );

  it("guards against accidental production / non-local execution", () => {
    expect(source).toContain('NODE_ENV === "production"');
    expect(source).toContain("ALLOW_DIRECTORY_SEED");
    expect(source).toContain("127.0.0.1");
    expect(source).toContain("volunteer_platform");
  });

  it("uses stable seed identifiers and upserts (no blind creates)", () => {
    expect(source).toContain("directory-seed.example");
    expect(source).toContain("[directory-seed]");
    expect(source).toContain("upsert");
    expect(source).toContain("VISIBLE_MEMBER_COUNT = 35");
    expect(source).toContain("VISIBLE_ALUMNI_COUNT = 20");
    expect(source).toContain("CHAPTER_NAMES");
  });

  it("includes visibility edge cases without counting them as the ≥50 visible set", () => {
    expect(source).toContain('approvalStatus: "PENDING"');
    expect(source).toContain("directoryOptIn: false");
    expect(source).toContain("adminHidden: true");
    expect(source).toContain("userId: null");
    expect(source).toContain("upsertEdgeCases");
  });

  it("scopes cleanup to seed-owned records only, including alumni related rows", () => {
    expect(source).toContain("--cleanup");
    expect(source).toContain("endsWith: `@${EMAIL_DOMAIN}`");
    expect(source).toContain("startsWith: SEED_PREFIX");
    expect(source).toContain("alumniHackInvolvement.deleteMany");
    expect(source).toContain("alumniJobExperience.deleteMany");
    expect(source).toContain("alumni.deleteMany");
    expect(source).toContain("member.deleteMany");
    expect(source).toContain("user.deleteMany");
    expect(source).toContain("chapter.deleteMany");
  });
});
