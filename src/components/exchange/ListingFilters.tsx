"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  FormInput,
  FormLabel,
  FormSelect,
} from "@/components/ui/Form";
import { MAX_SEARCH_LENGTH } from "@/lib/sourced-projects/listing-input";
import {
  hasListingQuery,
  SEARCH_PARAMS,
} from "@/lib/sourced-projects/listing-search";
import {
  CAUSE_AREA_LABELS,
  STATUS_LABELS,
} from "@/lib/sourced-projects/labels";
import type {
  Chapter,
  ListingsQuery,
} from "@/lib/sourced-projects/listings-api";

const SEARCH_DEBOUNCE_MS = 300;

type QueryKey = keyof typeof SEARCH_PARAMS;

// Search bar and filter panel. Each change replaces the URL, and the page
// re-renders on the server with the new query, so the URL is the only state.
export function ListingFilters({
  query,
  chapters,
}: {
  query: ListingsQuery;
  chapters: Chapter[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const urlSearch = query.search ?? "";
  const [search, setSearch] = useState(urlSearch);
  const [knownUrlSearch, setKnownUrlSearch] = useState(urlSearch);
  const [lastPushedSearch, setLastPushedSearch] = useState(urlSearch);

  // The URL changed without us (back button, a link): show its search. Our own
  // debounced pushes are skipped so a late response can't undo newer typing.
  if (urlSearch !== knownUrlSearch) {
    setKnownUrlSearch(urlSearch);
    if (urlSearch !== lastPushedSearch) setSearch(urlSearch);
  }

  const current: Record<QueryKey, string> = {
    search: urlSearch,
    status: query.filter?.status ?? "",
    causeArea: query.filter?.causeArea ?? "",
    sourcingChapterId: query.filter?.sourcingChapterId ?? "",
  };

  function navigate(changes: Partial<Record<QueryKey, string>>) {
    const next = { ...current, ...changes };
    const params = new URLSearchParams();
    for (const key of Object.keys(SEARCH_PARAMS) as QueryKey[]) {
      if (next[key]) params.set(SEARCH_PARAMS[key], next[key]);
    }
    if (changes.search !== undefined) setLastPushedSearch(changes.search);
    const qs = params.toString();
    startTransition(() =>
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    );
  }

  function changeSearch(value: string) {
    setSearch(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(
      () => navigate({ search: value.trim() }),
      SEARCH_DEBOUNCE_MS
    );
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearTimeout(debounce.current);
    navigate({ search: search.trim() });
  }

  function clearAll() {
    clearTimeout(debounce.current);
    setSearch("");
    navigate({ search: "", status: "", causeArea: "", sourcingChapterId: "" });
  }

  const filterSelect = (
    key: Exclude<QueryKey, "search">,
    label: string,
    allLabel: string,
    options: [value: string, label: string][]
  ) => (
    <FormField className="min-w-160 flex-1 sm:flex-none">
      <FormLabel className="text-gray-3 font-normal">{label}</FormLabel>
      <FormSelect
        value={current[key]}
        onValueChange={(value) => navigate({ [key]: value })}
      >
        <option value="">{allLabel}</option>
        {options.map(([value, optionLabel]) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </FormSelect>
    </FormField>
  );

  return (
    <div className="flex flex-col gap-12" aria-busy={pending}>
      <form role="search" onSubmit={submitSearch}>
        <FormField>
          <FormLabel className="sr-only">Search projects</FormLabel>
          <div className="relative">
            <Search
              size={12}
              strokeWidth={1.75}
              className="text-gray-3 pointer-events-none absolute top-1/2 left-12 -translate-y-1/2"
            />
            <FormInput
              type="search"
              value={search}
              onValueChange={changeSearch}
              maxLength={MAX_SEARCH_LENGTH}
              placeholder="Search titles, descriptions, and scope"
              className="pl-32"
            />
          </div>
        </FormField>
      </form>
      <div className="flex flex-wrap items-end gap-12">
        {filterSelect(
          "status",
          "Status",
          "Any status",
          Object.entries(STATUS_LABELS)
        )}
        {filterSelect(
          "causeArea",
          "Cause area",
          "All causes",
          Object.entries(CAUSE_AREA_LABELS)
        )}
        {filterSelect(
          "sourcingChapterId",
          "Chapter",
          "All chapters",
          chapters.map((chapter) => [chapter.id, chapter.name])
        )}
        {(hasListingQuery(query) || search) && (
          <Button variant="ghost" className="h-32" onClick={clearAll}>
            Clear filters
          </Button>
        )}
        {pending && (
          <span role="status" className="text-gray-3 self-center">
            Updating…
          </span>
        )}
      </div>
    </div>
  );
}
