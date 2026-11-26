import { z } from "zod";
import {
  DIRECTORY_POSITIONS,
  type DirectoryPositionName,
} from "@/lib/directory/role-mappings";

/**
 * Directory list/search query parameters.
 *
 * Defaults (documented for callers and the members page):
 *   q              — omitted / empty after trim → no keyword filter
 *   chapterId      — optional cuid; invalid values ignored
 *   position       — DirectoryPosition enum; invalid ignored
 *   graduationYear — integer in the same window as profile validators; invalid ignored
 *   kind           — "all" | "member" | "alumni" (default "all")
 *   sort           — "name" | "graduationYear" (default "name")
 *   order          — "asc" | "desc" (default "asc")
 *   page           — 1-based; default 1; non-numeric / <1 → 1
 *   pageSize       — default 20; max 50; non-numeric / <1 → default; >max → max
 *
 * Repeated query keys: the first value wins (URLSearchParams.get semantics).
 * Unsupported keys are ignored. Malformed input never throws — it normalizes.
 */

export const DIRECTORY_SEARCH_DEFAULT_PAGE_SIZE = 20;
export const DIRECTORY_SEARCH_MAX_PAGE_SIZE = 50;
/** Hard cap so OFFSET = (page-1)*pageSize stays bounded for abusive inputs. */
export const DIRECTORY_SEARCH_MAX_PAGE = 1_000;
export const DIRECTORY_SEARCH_MAX_QUERY_LENGTH = 120;

export const DIRECTORY_SEARCH_KINDS = ["all", "member", "alumni"] as const;
export type DirectorySearchKind = (typeof DIRECTORY_SEARCH_KINDS)[number];

export const DIRECTORY_SEARCH_SORTS = ["name", "graduationYear"] as const;
export type DirectorySearchSort = (typeof DIRECTORY_SEARCH_SORTS)[number];

export const DIRECTORY_SEARCH_ORDERS = ["asc", "desc"] as const;
export type DirectorySearchOrder = (typeof DIRECTORY_SEARCH_ORDERS)[number];

const positionSet = new Set<string>(DIRECTORY_POSITIONS);
const kindSet = new Set<string>(DIRECTORY_SEARCH_KINDS);
const sortSet = new Set<string>(DIRECTORY_SEARCH_SORTS);
const orderSet = new Set<string>(DIRECTORY_SEARCH_ORDERS);

const currentYear = new Date().getFullYear();
const minGraduationYear = 1990;
const maxGraduationYear = currentYear + 8;

const cuidSchema = z.string().cuid();

export type DirectorySearchParams = {
  q?: string;
  chapterId?: string;
  position?: DirectoryPositionName;
  graduationYear?: number;
  kind: DirectorySearchKind;
  sort: DirectorySearchSort;
  order: DirectorySearchOrder;
  page: number;
  pageSize: number;
};

function firstString(
  value: string | string[] | undefined | null
): string | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value[0];
  return value;
}

function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
  max?: number
): number {
  if (raw == null || raw.trim() === "") return fallback;
  // Reject scientific notation / decimals; parseInt("1e9") → 1, but also
  // clamp absurd magnitudes so OFFSET cannot explode.
  if (!/^\d+$/.test(raw.trim())) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(n) || n < 1) return fallback;
  if (max != null && n > max) return max;
  return n;
}

/**
 * Normalize a loose query-param bag (Next.js searchParams or URLSearchParams)
 * into a safe DirectorySearchParams value. Never throws.
 */
export function parseDirectorySearchParams(
  input:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | undefined
    | null
): DirectorySearchParams {
  const read = (key: string): string | undefined => {
    if (!input) return undefined;
    if (input instanceof URLSearchParams) {
      const v = input.get(key);
      return v == null ? undefined : v;
    }
    return firstString(input[key]);
  };

  const rawQ = read("q")?.trim() ?? "";
  const q =
    rawQ.length === 0
      ? undefined
      : rawQ.slice(0, DIRECTORY_SEARCH_MAX_QUERY_LENGTH);

  const rawChapter = read("chapterId")?.trim();
  let chapterId: string | undefined;
  if (rawChapter) {
    const parsed = cuidSchema.safeParse(rawChapter);
    if (parsed.success) chapterId = parsed.data;
  }

  const rawPosition = read("position")?.trim();
  const position =
    rawPosition && positionSet.has(rawPosition)
      ? (rawPosition as DirectoryPositionName)
      : undefined;

  const rawYear = read("graduationYear")?.trim();
  let graduationYear: number | undefined;
  if (rawYear) {
    const year = Number.parseInt(rawYear, 10);
    if (
      Number.isFinite(year) &&
      year >= minGraduationYear &&
      year <= maxGraduationYear
    ) {
      graduationYear = year;
    }
  }

  const rawKind = read("kind")?.trim().toLowerCase();
  const kind =
    rawKind && kindSet.has(rawKind) ? (rawKind as DirectorySearchKind) : "all";

  const rawSort = read("sort")?.trim();
  const sort =
    rawSort && sortSet.has(rawSort) ? (rawSort as DirectorySearchSort) : "name";

  const rawOrder = read("order")?.trim().toLowerCase();
  const order =
    rawOrder && orderSet.has(rawOrder)
      ? (rawOrder as DirectorySearchOrder)
      : "asc";

  const page = parsePositiveInt(read("page"), 1, DIRECTORY_SEARCH_MAX_PAGE);
  const pageSize = parsePositiveInt(
    read("pageSize"),
    DIRECTORY_SEARCH_DEFAULT_PAGE_SIZE,
    DIRECTORY_SEARCH_MAX_PAGE_SIZE
  );

  return {
    q,
    chapterId,
    position,
    graduationYear,
    kind,
    sort,
    order,
    page,
    pageSize,
  };
}

/** Build a query-string (without leading ?) from normalized params, omitting defaults. */
export function serializeDirectorySearchParams(
  params: DirectorySearchParams
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.chapterId) sp.set("chapterId", params.chapterId);
  if (params.position) sp.set("position", params.position);
  if (params.graduationYear != null) {
    sp.set("graduationYear", String(params.graduationYear));
  }
  if (params.kind !== "all") sp.set("kind", params.kind);
  if (params.sort !== "name") sp.set("sort", params.sort);
  if (params.order !== "asc") sp.set("order", params.order);
  if (params.page !== 1) sp.set("page", String(params.page));
  if (params.pageSize !== DIRECTORY_SEARCH_DEFAULT_PAGE_SIZE) {
    sp.set("pageSize", String(params.pageSize));
  }
  return sp.toString();
}
