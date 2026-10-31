"use server";

import { db } from "@/lib/db";
import { assertSession } from "@/lib/auth/guards";
import { searchDirectoryProfiles } from "@/lib/directory/search";
import { memberFacingDirectoryWhere } from "@/lib/directory/visibility";
import {
  parseDirectorySearchParams,
  type DirectorySearchParams,
} from "@/lib/validators/directory-search";

/**
 * Authenticated directory search. Visibility is enforced inside
 * `searchDirectoryProfiles` from `MEMBER_FACING_VISIBILITY`.
 */
export async function searchDirectory(
  input?:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | DirectorySearchParams
) {
  await assertSession();

  const params =
    input &&
    typeof input === "object" &&
    "page" in input &&
    "pageSize" in input &&
    "kind" in input &&
    "sort" in input &&
    "order" in input
      ? (input as DirectorySearchParams)
      : parseDirectorySearchParams(
          input as
            | URLSearchParams
            | Record<string, string | string[] | undefined>
            | undefined
        );

  return searchDirectoryProfiles(db, params);
}

/**
 * Chapters for the directory filter dropdown.
 * Session-gated like other directory actions. Only chapters that have at least
 * one member-facing-visible Member or Alumni row — uses the same
 * `memberFacingDirectoryWhere` predicate as search.
 */
export async function listDirectoryChapters() {
  await assertSession();

  return db.chapter.findMany({
    where: {
      OR: [
        { members: { some: memberFacingDirectoryWhere } },
        { alumni: { some: memberFacingDirectoryWhere } },
      ],
    },
    select: { id: true, name: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}
