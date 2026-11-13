"use client";

import { useRouter } from "next/navigation";
import { DIRECTORY_POSITIONS } from "@/lib/directory/role-mappings";
import { clampDirectorySearchPage } from "@/lib/directory/search-where";
import {
  DIRECTORY_SEARCH_DEFAULT_PAGE_SIZE,
  DIRECTORY_SEARCH_KINDS,
  DIRECTORY_SEARCH_ORDERS,
  DIRECTORY_SEARCH_SORTS,
  type DirectorySearchParams,
  serializeDirectorySearchParams,
} from "@/lib/validators/directory-search";

type ChapterOption = { id: string; name: string };

type Props = {
  params: DirectorySearchParams;
  chapters: ChapterOption[];
  total: number;
  pageCount: number;
};

/**
 * GET form keeps search/filter/sort/pageSize state in the URL. Submitting omits
 * `page` so pagination resets to 1 whenever search or filters change.
 */
export function DirectorySearchControls({
  params,
  chapters,
  total,
  pageCount,
}: Props) {
  const router = useRouter();
  // When the URL page is past the last page, navigate relative to the last
  // valid page so Previous/Next remain usable.
  const safePage = clampDirectorySearchPage(params.page, pageCount);
  const pageOutOfRange = pageCount > 0 && params.page > pageCount;

  function goToPage(page: number) {
    const next = serializeDirectorySearchParams({ ...params, page });
    router.push(next ? `/members?${next}` : "/members");
  }

  return (
    <div className="flex flex-col gap-16">
      <form
        method="get"
        action="/members"
        className="border-separator flex flex-wrap items-end gap-12 border-b pb-16"
      >
        <label className="flex min-w-200 flex-1 flex-col gap-4">
          <span className="text-gray-3 text-sm">Search</span>
          <input
            name="q"
            type="search"
            defaultValue={params.q ?? ""}
            placeholder="Name, bio, skills, interests…"
            maxLength={120}
            className="border-separator bg-panel rounded-4 h-32 border px-10 text-lg"
          />
        </label>

        <label className="flex w-180 flex-col gap-4">
          <span className="text-gray-3 text-sm">Chapter</span>
          <select
            name="chapterId"
            defaultValue={params.chapterId ?? ""}
            className="border-separator bg-panel rounded-4 h-32 border px-8 text-lg"
          >
            <option value="">All chapters</option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex w-160 flex-col gap-4">
          <span className="text-gray-3 text-sm">Role</span>
          <select
            name="position"
            defaultValue={params.position ?? ""}
            className="border-separator bg-panel rounded-4 h-32 border px-8 text-lg"
          >
            <option value="">All roles</option>
            {DIRECTORY_POSITIONS.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </label>

        <label className="flex w-140 flex-col gap-4">
          <span className="text-gray-3 text-sm">Grad year</span>
          <input
            name="graduationYear"
            type="number"
            inputMode="numeric"
            defaultValue={params.graduationYear ?? ""}
            placeholder="e.g. 2026"
            className="border-separator bg-panel rounded-4 h-32 border px-10 text-lg"
          />
        </label>

        <label className="flex w-140 flex-col gap-4">
          <span className="text-gray-3 text-sm">Kind</span>
          <select
            name="kind"
            defaultValue={params.kind}
            className="border-separator bg-panel rounded-4 h-32 border px-8 text-lg"
          >
            {DIRECTORY_SEARCH_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind === "all"
                  ? "Members + alumni"
                  : kind === "member"
                    ? "Members"
                    : "Alumni"}
              </option>
            ))}
          </select>
        </label>

        <label className="flex w-160 flex-col gap-4">
          <span className="text-gray-3 text-sm">Sort</span>
          <select
            name="sort"
            defaultValue={params.sort}
            className="border-separator bg-panel rounded-4 h-32 border px-8 text-lg"
          >
            {DIRECTORY_SEARCH_SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {sort === "name" ? "Name" : "Graduation year"}
              </option>
            ))}
          </select>
        </label>

        <label className="flex w-120 flex-col gap-4">
          <span className="text-gray-3 text-sm">Order</span>
          <select
            name="order"
            defaultValue={params.order}
            className="border-separator bg-panel rounded-4 h-32 border px-8 text-lg"
          >
            {DIRECTORY_SEARCH_ORDERS.map((order) => (
              <option key={order} value={order}>
                {order === "asc" ? "Ascending" : "Descending"}
              </option>
            ))}
          </select>
        </label>

        {params.pageSize !== DIRECTORY_SEARCH_DEFAULT_PAGE_SIZE ? (
          <input type="hidden" name="pageSize" value={params.pageSize} />
        ) : null}

        <button type="submit" className="btn-high-contrast h-32 px-14 text-lg">
          Apply
        </button>
      </form>

      <div className="text-gray-3 flex flex-wrap items-center justify-between gap-8 text-sm">
        <span>
          {total === 0
            ? "No matching profiles"
            : `${total.toLocaleString()} matching profile${total === 1 ? "" : "s"}`}
          {pageCount > 0 ? ` · Page ${safePage} of ${pageCount}` : null}
          {pageOutOfRange
            ? ` · Requested page ${params.page} is out of range`
            : null}
        </span>
        {pageCount > 1 || pageOutOfRange ? (
          <div className="flex items-center gap-8">
            <button
              type="button"
              className="btn-ghost h-28 px-10 disabled:opacity-40"
              disabled={safePage <= 1}
              onClick={() => goToPage(safePage - 1)}
            >
              Previous
            </button>
            {pageOutOfRange ? (
              <button
                type="button"
                className="btn-ghost h-28 px-10"
                onClick={() => goToPage(pageCount)}
              >
                Go to last page
              </button>
            ) : null}
            <button
              type="button"
              className="btn-ghost h-28 px-10 disabled:opacity-40"
              disabled={safePage >= pageCount}
              onClick={() => goToPage(safePage + 1)}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
