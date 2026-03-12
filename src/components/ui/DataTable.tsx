"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
};

export type FilterField = {
  key: string;
  label: string;
};

type SortState = { key: string; dir: "asc" | "desc" } | null;

type DataTableProps<T extends Record<string, unknown>> = {
  columns: Column<T>[];
  data: T[];
  rowKey?: keyof T;
  noun?: string;
  filterFields?: FilterField[];
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  noun = "row",
  filterFields,
}: DataTableProps<T>) {
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

  // Derive unique filter options from data
  const filterOptions = useMemo(() => {
    if (!filterFields?.length) return {} as Record<string, string[]>;
    const opts: Record<string, string[]> = {};
    for (const field of filterFields) {
      const values = new Set<string>();
      for (const row of data) {
        const val = row[field.key];
        if (typeof val === "string" && val) values.add(val);
      }
      opts[field.key] = Array.from(values).sort();
    }
    return opts;
  }, [data, filterFields]);

  const afterSearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) =>
      columns.some((col) =>
        String(row[col.key] ?? "")
          .toLowerCase()
          .includes(q)
      )
    );
  }, [data, search, columns]);

  const afterFilter = useMemo(() => {
    const active = Object.entries(filters).filter(([, s]) => s.size > 0);
    if (!active.length) return afterSearch;
    return afterSearch.filter((row) =>
      active.every(([key, set]) => set.has(String(row[key] ?? "")))
    );
  }, [afterSearch, filters]);

  const processed = useMemo(() => {
    if (!sort) return afterFilter;
    return [...afterFilter].sort((a, b) => {
      const cmp = String(a[sort.key] ?? "").localeCompare(
        String(b[sort.key] ?? ""),
        undefined,
        { numeric: true }
      );
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [afterFilter, sort]);

  const activeFilterCount = Object.values(filters).filter(
    (s) => s.size > 0
  ).length;

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

  const count = processed.length;
  const countLabel = `${count} ${count === 1 ? noun : `${noun}s`}`;

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
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M14 14L10.4 10.4M11.8 6.9C11.8 9.6 9.6 11.8 6.9 11.8C4.2 11.8 2 9.6 2 6.9C2 4.2 4.2 2 6.9 2C9.6 2 11.8 4.2 11.8 6.9Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${noun}s...`}
            className="border-border bg-surface placeholder:text-text-disabled text-text-primary focus:border-brand h-7 w-full rounded-sm border py-1 pr-3 pl-7 text-sm focus:outline-none"
          />
        </div>

        {/* Sort */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => {
              setSortOpen((v) => !v);
              setFilterOpen(false);
            }}
            className={cn(
              "border-border inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-sm border px-2.5 text-sm font-medium transition-colors",
              sort
                ? "bg-canvas text-text-primary"
                : "bg-card text-text-primary hover:bg-surface"
            )}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M2 4h12M4 8h8M6 12h4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Sort
            {sort && (
              <span className="text-text-meta font-normal">
                · {columns.find((c) => c.key === sort.key)?.label}{" "}
                {sort.dir === "asc" ? "↑" : "↓"}
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
                        "flex items-center justify-between rounded px-2.5 py-1.5 text-left text-sm transition-colors",
                        active
                          ? "bg-canvas text-text-primary font-medium"
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
                    className="text-text-secondary hover:bg-surface hover:text-text-primary w-full rounded px-2.5 py-1.5 text-left text-sm transition-colors"
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
              className={cn(
                "border-border inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-sm border px-2.5 text-sm font-medium transition-colors",
                activeFilterCount > 0
                  ? "bg-canvas text-text-primary"
                  : "bg-card text-text-primary hover:bg-surface"
              )}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                className="shrink-0"
              >
                <path
                  d="M2 3h12l-4.5 5.5V13l-3-1.5V8.5L2 3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
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
                          <span className="text-text-primary text-sm">
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
                      className="text-text-secondary hover:bg-surface hover:text-text-primary w-full rounded px-2.5 py-1.5 text-left text-sm transition-colors"
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
                key={rowKey ? String(row[rowKey]) : i}
                className="border-divider border-b last:border-0"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="text-text-primary px-3 py-[7px] text-sm"
                  >
                    {col.render
                      ? col.render(row)
                      : String(row[col.key as keyof T] ?? "")}
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
