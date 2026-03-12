"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";

export type FilterField = {
  key: string;
  label: string;
};

type SortState = { key: string; dir: "asc" | "desc" } | null;

type DataTableProps = {
  data: Record<string, string>[];
  rowKey?: string;
  noun?: string;
  filterFields?: FilterField[];
};

// Matches the secondary Button variant exactly
const toolbarBtn = cn(
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border",
  "border-border bg-card text-text-primary text-sm font-medium",
  "hover:bg-surface active:bg-canvas transition-colors",
  "focus-visible:outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
  "px-3"
);

const toolbarBtnActive = cn(
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border",
  "border-border bg-canvas text-text-primary text-sm font-medium",
  "hover:bg-canvas active:bg-canvas transition-colors",
  "focus-visible:outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
  "px-3"
);

function SortIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M3 6h18M6 12h12M10 18h4" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M22 3H2l8 9.46V19l4 2V12.46L22 3z" />
    </svg>
  );
}

export function DataTable({
  data,
  rowKey = "id",
  noun = "row",
  filterFields,
}: DataTableProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>(null);
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setFilterOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Derive columns from data keys, excluding the row key
  const columns = useMemo(() => {
    const keys = Object.keys(data[0] ?? {}).filter((k) => k !== rowKey);
    return keys.map((key) => ({ key, label: key }));
  }, [data, rowKey]);

  const filterOptions = useMemo(() => {
    if (!filterFields?.length) return {} as Record<string, string[]>;
    const opts: Record<string, string[]> = {};
    for (const field of filterFields) {
      const seen = new Set<string>();
      for (const row of data) {
        const val = row[field.key];
        if (val) seen.add(val);
      }
      opts[field.key] = Array.from(seen).sort();
    }
    return opts;
  }, [data, filterFields]);

  const afterSearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) =>
      columns.some((col) => (row[col.key] ?? "").toLowerCase().includes(q))
    );
  }, [data, search, columns]);

  const afterFilter = useMemo(() => {
    const active = Object.entries(filters).filter(([, s]) => s.size > 0);
    if (!active.length) return afterSearch;
    return afterSearch.filter((row) =>
      active.every(([key, set]) => set.has(row[key] ?? ""))
    );
  }, [afterSearch, filters]);

  const processed = useMemo(() => {
    if (!sort) return afterFilter;
    return [...afterFilter].sort((a, b) => {
      const cmp = (a[sort.key] ?? "").localeCompare(
        b[sort.key] ?? "",
        undefined,
        { numeric: true }
      );
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [afterFilter, sort]);

  const activeFilterCount = Object.values(filters).filter(
    (s) => s.size > 0
  ).length;
  const isFiltered = !!search.trim() || activeFilterCount > 0;
  const total = data.length;
  const shown = processed.length;
  const noun_plural = (n: number) => `${n} ${n === 1 ? noun : `${noun}s`}`;
  const countLabel = isFiltered
    ? `${shown} of ${noun_plural(total)}`
    : noun_plural(total);

  function toggleFilter(key: string, value: string) {
    setFilters((prev) => {
      const set = new Set(prev[key] ?? []);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...prev, [key]: set };
    });
  }

  function cycleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  return (
    <div className="border-border bg-card flex flex-1 flex-col overflow-hidden rounded-md border">
      {/* Toolbar */}
      <div className="border-divider flex flex-shrink-0 items-center gap-2 border-b px-3 py-2">
        <span className="text-text-secondary text-sm whitespace-nowrap">
          {countLabel}
        </span>

        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="text-text-disabled pointer-events-none absolute top-1/2 left-2 -translate-y-1/2"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${noun}s...`}
            className="border-border bg-surface placeholder:text-text-disabled text-text-primary focus:border-brand h-8 w-full rounded-sm border py-1 pr-3 pl-7 text-sm font-normal focus:outline-none"
          />
        </div>

        {/* Sort */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => {
              setSortOpen((v) => !v);
              setFilterOpen(false);
            }}
            className={sort ? toolbarBtnActive : toolbarBtn}
          >
            <SortIcon />
            Sort
            {sort && (
              <span className="text-text-meta font-normal">
                · {sort.key} {sort.dir === "asc" ? "↑" : "↓"}
              </span>
            )}
          </button>

          {sortOpen && (
            <div className="border-border bg-card absolute top-full right-0 z-20 mt-1 w-52 rounded-md border shadow-sm">
              <div className="border-divider border-b px-3 py-2">
                <span className="text-text-meta text-xs tracking-[0.08em] uppercase">
                  Sort by
                </span>
              </div>
              <div className="flex flex-col gap-0.5 p-1.5">
                {columns.map((col) => {
                  const active = sort?.key === col.key;
                  return (
                    <button
                      key={col.key}
                      onClick={() => cycleSort(col.key)}
                      className={cn(
                        "flex items-center justify-between rounded px-2.5 py-1.5 text-left text-sm font-normal transition-colors",
                        active
                          ? "bg-canvas text-text-primary"
                          : "text-text-secondary hover:bg-surface hover:text-text-primary"
                      )}
                    >
                      {col.label}
                      {active && (
                        <span className="text-text-meta text-xs">
                          {sort!.dir === "asc" ? "↑ A→Z" : "↓ Z→A"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {sort && (
                <div className="border-divider border-t p-1.5">
                  <button
                    onClick={() => setSort(null)}
                    className="text-text-secondary hover:bg-surface hover:text-text-primary w-full rounded px-2.5 py-1.5 text-left text-sm font-normal transition-colors"
                  >
                    Clear sort
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter */}
        {filterFields && filterFields.length > 0 && (
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => {
                setFilterOpen((v) => !v);
                setSortOpen(false);
              }}
              className={activeFilterCount > 0 ? toolbarBtnActive : toolbarBtn}
            >
              <FilterIcon />
              Filter
              {activeFilterCount > 0 && (
                <span className="text-text-meta font-normal">
                  · {activeFilterCount}
                </span>
              )}
            </button>

            {filterOpen && (
              <div className="border-border bg-card absolute top-full right-0 z-20 mt-1 w-52 rounded-md border shadow-sm">
                {filterFields.map((field, i) => (
                  <div
                    key={field.key}
                    className={cn(i > 0 && "border-divider border-t")}
                  >
                    <div className="border-divider border-b px-3 py-2">
                      <span className="text-text-meta text-xs tracking-[0.08em] uppercase">
                        {field.label}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 p-1.5">
                      {(filterOptions[field.key] ?? []).map((opt) => (
                        <label
                          key={opt}
                          className="hover:bg-surface flex cursor-pointer items-center gap-2 rounded px-2.5 py-1.5"
                        >
                          <input
                            type="checkbox"
                            checked={filters[field.key]?.has(opt) ?? false}
                            onChange={() => toggleFilter(field.key, opt)}
                            className="accent-brand"
                          />
                          <span className="text-text-primary text-sm font-normal">
                            {opt}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {activeFilterCount > 0 && (
                  <div className="border-divider border-t p-1.5">
                    <button
                      onClick={() => setFilters({})}
                      className="text-text-secondary hover:bg-surface hover:text-text-primary w-full rounded px-2.5 py-1.5 text-left text-sm font-normal transition-colors"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="[&::-webkit-scrollbar-thumb]:bg-border flex-1 overflow-auto overscroll-none [scrollbar-color:var(--color-border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-track]:bg-transparent">
        <table className="w-full min-w-max">
          <thead className="bg-surface sticky top-0 z-10">
            <tr className="border-divider border-b">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-text-meta px-3 py-[7px] text-left text-xs font-normal tracking-[0.08em] whitespace-nowrap uppercase"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processed.map((row, i) => (
              <tr
                key={row[rowKey] ?? i}
                className="border-divider border-b last:border-0"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="text-text-primary px-3 py-[7px] text-sm"
                  >
                    {col.key === "Status" && row[col.key] ? (
                      <StatusBadge status={row[col.key]} />
                    ) : (
                      (row[col.key] ?? "")
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
