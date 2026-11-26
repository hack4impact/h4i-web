import { Prisma, type PrismaClient } from "@prisma/client";
import { MEMBER_FACING_VISIBILITY } from "@/lib/directory/visibility";
import { ilikeContainsPattern } from "@/lib/directory/ilike";
import type { DirectorySearchParams } from "@/lib/validators/directory-search";

export {
  buildDirectoryProfileWhere,
  clampDirectorySearchPage,
} from "@/lib/directory/search-where";

/**
 * Member / Alumni directory search.
 *
 * Visibility: SQL predicates are built from `MEMBER_FACING_VISIBILITY` — the same
 * constants backing `isMemberFacingDirectoryVisible` and
 * `memberFacingDirectoryWhere`. Count and result queries share `filterSql`.
 *
 * Keyword (`q`): parameterized ILIKE substring on displayName, bio, major,
 * location, contactEmail, and skills / interests elements. `%` / `_` / `\` in
 * the user query are escaped so they match literally.
 *
 * Filters (chapterId, position, graduationYear, kind) combine with keyword via AND.
 *
 * Sort: `name` → displayName; `graduationYear` → graduationYear.
 * Tie-breakers (deterministic): kind ASC, then id with the same direction as
 * the primary sort. Nullable sort keys use NULLS LAST in both directions.
 *
 * Pagination: pageSize default 20, max 50; page max 1000 (see validators).
 * Out-of-range pages return an empty `items` array with the true `total`.
 */

export type DirectoryProfileKind = "member" | "alumni";

export type DirectorySearchHit = {
  kind: DirectoryProfileKind;
  id: string;
  displayName: string | null;
  contactEmail: string | null;
  graduationYear: number | null;
  major: string | null;
  location: string | null;
  bio: string | null;
  skills: string[];
  interests: string[];
  position: string | null;
  chapter: { id: string; name: string } | null;
};

export type DirectorySearchResult = {
  items: DirectorySearchHit[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  params: DirectorySearchParams;
};

type DbClient = PrismaClient | Prisma.TransactionClient;

/** ESCAPE clause for ilikeContainsPattern — keep in sync with `ilike.ts`. */
const ILIKE_ESCAPE = Prisma.raw(`ESCAPE E'\\\\'`);

/**
 * Member-facing visibility SQL derived from MEMBER_FACING_VISIBILITY.
 * Alias must be a trusted identifier (only "m" / "a" are passed by this module).
 */
export function memberFacingVisibilitySql(alias: "m" | "a"): Prisma.Sql {
  const a = Prisma.raw(`"${alias}"`);
  const v = MEMBER_FACING_VISIBILITY;
  return Prisma.sql`(
    ${a}."userId" IS NOT NULL
    AND ${a}."approvalStatus" = ${v.approvalStatus}
    AND ${a}."directoryOptIn" = ${v.directoryOptIn}
    AND ${a}."adminHidden" = ${v.adminHidden}
  )`;
}

function keywordSql(alias: "m" | "a", q: string): Prisma.Sql {
  const a = Prisma.raw(`"${alias}"`);
  const pattern = ilikeContainsPattern(q);
  return Prisma.sql`(
    ${a}."displayName" ILIKE ${pattern} ${ILIKE_ESCAPE}
    OR ${a}."bio" ILIKE ${pattern} ${ILIKE_ESCAPE}
    OR ${a}."major" ILIKE ${pattern} ${ILIKE_ESCAPE}
    OR ${a}."location" ILIKE ${pattern} ${ILIKE_ESCAPE}
    OR ${a}."contactEmail" ILIKE ${pattern} ${ILIKE_ESCAPE}
    OR EXISTS (
      SELECT 1 FROM unnest(${a}."skills") AS skill
      WHERE skill ILIKE ${pattern} ${ILIKE_ESCAPE}
    )
    OR EXISTS (
      SELECT 1 FROM unnest(${a}."interests") AS interest
      WHERE interest ILIKE ${pattern} ${ILIKE_ESCAPE}
    )
  )`;
}

function filterSql(
  alias: "m" | "a",
  params: DirectorySearchParams
): Prisma.Sql {
  const a = Prisma.raw(`"${alias}"`);
  const parts: Prisma.Sql[] = [memberFacingVisibilitySql(alias)];

  if (params.chapterId) {
    parts.push(Prisma.sql`${a}."chapterId" = ${params.chapterId}`);
  }
  if (params.position) {
    parts.push(
      Prisma.sql`${a}."position" = CAST(${params.position} AS "DirectoryPosition")`
    );
  }
  if (params.graduationYear != null) {
    parts.push(Prisma.sql`${a}."graduationYear" = ${params.graduationYear}`);
  }
  if (params.q) {
    parts.push(keywordSql(alias, params.q));
  }

  return parts.reduce((acc, part, i) =>
    i === 0 ? part : Prisma.sql`${acc} AND ${part}`
  );
}

function orderSql(params: DirectorySearchParams): Prisma.Sql {
  // order direction is a validated enum — safe to embed as raw ASC/DESC.
  const dir = params.order === "desc" ? "DESC" : "ASC";
  if (params.sort === "graduationYear") {
    return Prisma.raw(
      `"graduationYear" ${dir} NULLS LAST, kind ASC, id ${dir}`
    );
  }
  return Prisma.raw(`"displayName" ${dir} NULLS LAST, kind ASC, id ${dir}`);
}

type RawHit = {
  kind: string;
  id: string;
  displayName: string | null;
  contactEmail: string | null;
  graduationYear: number | null;
  major: string | null;
  location: string | null;
  bio: string | null;
  skills: string[] | null;
  interests: string[] | null;
  position: string | null;
  chapterId: string | null;
  chapterName: string | null;
};

function mapRawHit(row: RawHit): DirectorySearchHit {
  return {
    kind: row.kind === "alumni" ? "alumni" : "member",
    id: row.id,
    displayName: row.displayName,
    contactEmail: row.contactEmail,
    graduationYear: row.graduationYear,
    major: row.major,
    location: row.location,
    bio: row.bio,
    skills: row.skills ?? [],
    interests: row.interests ?? [],
    position: row.position,
    chapter:
      row.chapterId && row.chapterName
        ? { id: row.chapterId, name: row.chapterName }
        : null,
  };
}

export async function searchDirectoryProfiles(
  db: DbClient,
  params: DirectorySearchParams
): Promise<DirectorySearchResult> {
  const includeMember = params.kind === "all" || params.kind === "member";
  const includeAlumni = params.kind === "all" || params.kind === "alumni";
  // Same filterSql fragment for COUNT and SELECT — identical filters + visibility.
  const memberWhere = filterSql("m", params);
  const alumniWhere = filterSql("a", params);
  const skip = (params.page - 1) * params.pageSize;

  const countSql = Prisma.sql`
    SELECT (
      ${
        includeMember
          ? Prisma.sql`(SELECT COUNT(*)::bigint FROM "Member" AS m WHERE ${memberWhere})`
          : Prisma.sql`0::bigint`
      }
      +
      ${
        includeAlumni
          ? Prisma.sql`(SELECT COUNT(*)::bigint FROM "Alumni" AS a WHERE ${alumniWhere})`
          : Prisma.sql`0::bigint`
      }
    ) AS total
  `;

  const countRows = await db.$queryRaw<[{ total: bigint }]>`${countSql}`;
  const total = Number(countRows[0]?.total ?? 0n);
  const pageCount = total === 0 ? 0 : Math.ceil(total / params.pageSize);

  const memberSelect = Prisma.sql`
    SELECT
      'member'::text AS kind,
      m.id,
      m."displayName",
      m."contactEmail",
      m."graduationYear",
      m.major,
      m.location,
      m.bio,
      m.skills,
      m.interests,
      m.position::text AS position,
      c.id AS "chapterId",
      c.name AS "chapterName"
    FROM "Member" AS m
    LEFT JOIN "Chapter" AS c ON c.id = m."chapterId"
    WHERE ${memberWhere}
  `;

  const alumniSelect = Prisma.sql`
    SELECT
      'alumni'::text AS kind,
      a.id,
      a."displayName",
      a."contactEmail",
      a."graduationYear",
      a.major,
      a.location,
      a.bio,
      a.skills,
      a.interests,
      a.position::text AS position,
      c.id AS "chapterId",
      c.name AS "chapterName"
    FROM "Alumni" AS a
    LEFT JOIN "Chapter" AS c ON c.id = a."chapterId"
    WHERE ${alumniWhere}
  `;

  let unionBody: Prisma.Sql;
  if (includeMember && includeAlumni) {
    unionBody = Prisma.sql`${memberSelect} UNION ALL ${alumniSelect}`;
  } else if (includeMember) {
    unionBody = memberSelect;
  } else {
    unionBody = alumniSelect;
  }

  const rows = await db.$queryRaw<RawHit[]>`
    SELECT * FROM (
      ${unionBody}
    ) AS profiles
    ORDER BY ${orderSql(params)}
    LIMIT ${params.pageSize} OFFSET ${skip}
  `;

  return {
    items: rows.map(mapRawHit),
    total,
    page: params.page,
    pageSize: params.pageSize,
    pageCount,
    params,
  };
}
