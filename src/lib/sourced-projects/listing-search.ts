import type { CauseArea, SourcedProjectStatus } from "@prisma/client";
import { MAX_SEARCH_LENGTH } from "@/lib/sourced-projects/listing-input";
import {
  CAUSE_AREA_LABELS,
  STATUS_LABELS,
} from "@/lib/sourced-projects/labels";
import type { ListingsQuery } from "@/lib/sourced-projects/listings-api";

// Browse search and filters live in the URL so a filtered view can be shared
// and survives a reload: /exchange?q=tutoring&status=AVAILABLE&cause=HEALTH&chapter=<id>
export const SEARCH_PARAMS = {
  search: "q",
  status: "status",
  causeArea: "cause",
  sourcingChapterId: "chapter",
} as const;

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

const isKeyOf = <T extends object>(labels: T, value: string | undefined) =>
  value !== undefined && Object.hasOwn(labels, value);

// Unknown enum values are dropped rather than sent to the API, so a stale or
// hand-edited link shows unfiltered results instead of an error.
export function parseListingSearchParams(params: SearchParams): ListingsQuery {
  const status = first(params[SEARCH_PARAMS.status]);
  const causeArea = first(params[SEARCH_PARAMS.causeArea]);
  const sourcingChapterId = first(params[SEARCH_PARAMS.sourcingChapterId]);
  const search = first(params[SEARCH_PARAMS.search])?.slice(
    0,
    MAX_SEARCH_LENGTH
  );

  const filter = {
    ...(isKeyOf(STATUS_LABELS, status) && {
      status: status as SourcedProjectStatus,
    }),
    ...(isKeyOf(CAUSE_AREA_LABELS, causeArea) && {
      causeArea: causeArea as CauseArea,
    }),
    ...(sourcingChapterId && { sourcingChapterId }),
  };

  return {
    ...(Object.keys(filter).length > 0 && { filter }),
    ...(search && { search }),
  };
}

export const hasListingQuery = (query: ListingsQuery) =>
  Boolean(query.search || query.filter);
