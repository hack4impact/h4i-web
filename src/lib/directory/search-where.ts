import { memberFacingDirectoryWhere } from "@/lib/directory/visibility";
import type { DirectoryPositionName } from "@/lib/directory/role-mappings";

/**
 * Prisma-shaped where input for Member/Alumni list filters.
 * Kept free of a runtime `@prisma/client` import so unit tests can load it
 * without `prisma generate`.
 */
export type DirectoryProfileWhere = {
  AND?: DirectoryProfileWhere[];
  OR?: DirectoryProfileWhere[];
  userId?: { not: null };
  approvalStatus?: "APPROVED";
  directoryOptIn?: boolean;
  adminHidden?: boolean;
  chapterId?: string;
  position?: DirectoryPositionName;
  graduationYear?: number;
  displayName?: { contains: string; mode: "insensitive" };
  bio?: { contains: string; mode: "insensitive" };
  major?: { contains: string; mode: "insensitive" };
  location?: { contains: string; mode: "insensitive" };
  contactEmail?: { contains: string; mode: "insensitive" };
  skills?: { has: string };
  interests?: { has: string };
};

/**
 * Prisma where-input mirroring the SQL visibility + filter + keyword predicate.
 * Always ANDs `memberFacingDirectoryWhere` so unpublished rows cannot match.
 */
export function buildDirectoryProfileWhere(params: {
  q?: string;
  chapterId?: string;
  position?: DirectoryPositionName;
  graduationYear?: number;
}): DirectoryProfileWhere {
  const clauses: DirectoryProfileWhere[] = [{ ...memberFacingDirectoryWhere }];

  if (params.chapterId) {
    clauses.push({ chapterId: params.chapterId });
  }
  if (params.position) {
    clauses.push({ position: params.position });
  }
  if (params.graduationYear != null) {
    clauses.push({ graduationYear: params.graduationYear });
  }

  if (params.q) {
    const q = params.q;
    clauses.push({
      OR: [
        { displayName: { contains: q, mode: "insensitive" } },
        { bio: { contains: q, mode: "insensitive" } },
        { major: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { contactEmail: { contains: q, mode: "insensitive" } },
        { skills: { has: q } },
        { interests: { has: q } },
      ],
    });
  }

  return clauses.length === 1 ? clauses[0]! : { AND: clauses };
}

/**
 * Clamp page into [1, pageCount] for UI links. Data queries leave out-of-range
 * pages empty rather than rewriting the requested page number.
 */
export function clampDirectorySearchPage(
  page: number,
  pageCount: number
): number {
  if (pageCount <= 0) return 1;
  if (page < 1) return 1;
  if (page > pageCount) return pageCount;
  return page;
}
