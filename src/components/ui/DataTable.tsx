"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Menu } from "@base-ui/react/menu";
import { Input } from "@base-ui/react/input";
import {
  Search,
  ArrowUpDown,
  ListFilter,
  Check,
  DotIcon,
  ArrowDownZA,
  ArrowUpAZ,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterField = {
  key: string;
  label: string;
};

export type ColumnConfig = {
  key: string;
  render?: (value: string) => React.ReactNode;
};

type SortState = { key: string; dir: "asc" | "desc" } | null;

type DataTableProps = {
  data: Record<string, string>[];
  columns?: string[];
  rowKey?: string;
  noun?: string;
  filterFields?: FilterField[];
  columnConfig?: ColumnConfig[];
  defaultSort?: SortState;
  onRowClick?: (row: Record<string, string>) => void;
};

const toolbarBtn = "btn btn-ghost btn-lg";
const menuItemCls = "menu-item text-left select-none";
const menuPopupCls = "menu-popup";
const menuPositionerCls = "z-50";

export function DataTable({
  data,
  columns: columnsProp,
  rowKey = "id",
  noun = "row",
  filterFields,
  columnConfig,
  defaultSort = null,
  onRowClick,
}: DataTableProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>(defaultSort);
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});

  // Tracking scroll direction
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    top: false,
    bottom: false,
    left: false,
    right: false,
  });

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const {
      scrollTop,
      scrollHeight,
      clientHeight,
      scrollLeft,
      scrollWidth,
      clientWidth,
    } = scrollRef.current;

    setScrollState({
      top: scrollTop > 0,
      bottom: Math.ceil(scrollTop + clientHeight) < scrollHeight,
      left: scrollLeft > 0,
      right: Math.ceil(scrollLeft + clientWidth) < scrollWidth,
    });
  }, []);

  const columns = useMemo(() => {
    const keys = columnsProp?.length
      ? columnsProp.filter((k) => k !== rowKey)
      : Object.keys(data[0] ?? {}).filter((k) => k !== rowKey);
    return keys.map((key) => ({ key, label: key }));
  }, [columnsProp, data, rowKey]);

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

  // Attach ResizeObserver on mount & data change
  useEffect(() => {
    checkScroll();
    const currentRef = scrollRef.current;

    if (currentRef) {
      const observer = new ResizeObserver(checkScroll);
      observer.observe(currentRef);
      return () => observer.disconnect();
    }
  }, [checkScroll, processed]);

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
    <div className="border-separator bg-panel rounded-4 flex max-h-full flex-1 flex-col self-start overflow-hidden border">
      <div className="border-separator flex shrink-0 items-center gap-8 border-b px-12 py-8">
        <span className="text-gray-2 whitespace-nowrap">{countLabel}</span>

        <div className="rounded-6 bg-ghost-hover relative flex-1">
          <Search
            size={15}
            strokeWidth={1.5}
            className="pointer-events-none absolute top-1/2 left-8 -translate-y-1/2"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${noun}s...`}
            className="rounded-6 border-separator bg-gray h-32 w-full border py-4 pr-12 pl-28 placeholder:text-(--text-secondary) focus:border-(--accent) focus:outline-none"
          />
        </div>

        <Menu.Root modal={false}>
          <Menu.Trigger className={toolbarBtn}>
            <span className="flex flex-row items-center">
              <span className="flex flex-row items-center gap-8">
                <ArrowUpDown size={15} strokeWidth={1.5} />
                Sort
              </span>
              {sort && (
                <DotIcon size={15} strokeWidth={1.5} className="text-gray-2" />
              )}
              {sort && (
                <span className="text-gray-2 flex flex-row items-center gap-8">
                  {sort.key}{" "}
                  {sort.dir === "asc" ? (
                    <ArrowUpAZ size={15} strokeWidth={1.5} />
                  ) : (
                    <ArrowDownZA size={15} strokeWidth={1.5} />
                  )}
                </span>
              )}
            </span>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner
              className={menuPositionerCls}
              side="bottom"
              align="end"
              sideOffset={4}
            >
              <Menu.Popup className={menuPopupCls}>
                <div className="menu-caption text-gray-3">Sort by</div>
                <Menu.RadioGroup value={sort?.key ?? ""}>
                  {columns.map((col) => {
                    const active = sort?.key === col.key;
                    return (
                      <Menu.RadioItem
                        key={col.key}
                        value={col.key}
                        closeOnClick={false}
                        onClick={() => cycleSort(col.key)}
                        className={cn(menuItemCls, "justify-between gap-16")}
                      >
                        {col.label}
                        <span
                          className={
                            active ? "text-gray-2" : "text-transparent"
                          }
                        >
                          {active && sort!.dir === "desc" ? (
                            <ArrowDownZA size={15} strokeWidth={1.5} />
                          ) : (
                            <ArrowUpAZ size={15} strokeWidth={1.5} />
                          )}
                        </span>
                      </Menu.RadioItem>
                    );
                  })}
                </Menu.RadioGroup>
                {sort && (
                  <>
                    <div className="menu-separator" />
                    <Menu.Item
                      onClick={() => setSort(null)}
                      className={menuItemCls}
                    >
                      Clear sort
                    </Menu.Item>
                  </>
                )}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>

        {filterFields && filterFields.length > 0 && (
          <Menu.Root modal={false}>
            <Menu.Trigger className={toolbarBtn}>
              <ListFilter size={15} strokeWidth={1.5} />
              Filter
              {activeFilterCount > 0 && (
                <span className="text-gray-2">· {activeFilterCount}</span>
              )}
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner
                className={menuPositionerCls}
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <Menu.Popup className={menuPopupCls}>
                  {filterFields.map((field, i) => (
                    <div key={field.key}>
                      {i > 0 && <div className="menu-separator" />}
                      <div className="menu-caption text-gray-3">
                        {field.label}
                      </div>
                      {(filterOptions[field.key] ?? []).map((opt) => (
                        <Menu.CheckboxItem
                          key={opt}
                          checked={filters[field.key]?.has(opt) ?? false}
                          onCheckedChange={() => toggleFilter(field.key, opt)}
                          closeOnClick={false}
                          className={cn(menuItemCls, "gap-8")}
                        >
                          <span className="border-checkbox-outline flex h-14 w-14 shrink-0 items-center justify-center border">
                            <Menu.CheckboxItemIndicator>
                              <Check size={10} strokeWidth={2.5} />
                            </Menu.CheckboxItemIndicator>
                          </span>
                          <span>{opt}</span>
                        </Menu.CheckboxItem>
                      ))}
                    </div>
                  ))}
                  {activeFilterCount > 0 && (
                    <>
                      <div className="menu-separator" />
                      <Menu.Item
                        onClick={() => setFilters({})}
                        className={menuItemCls}
                      >
                        Clear filters
                      </Menu.Item>
                    </>
                  )}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        )}
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className={cn(
            "flex-1 overflow-auto overscroll-none transition-shadow duration-200",
            scrollState.left
              ? "inset-shadow-[6px_0_20px_-2px_var(--color-popup-outline)]"
              : ""
          )}
        >
          <table className="w-full min-w-max">
            <thead
              className={cn(
                "border-separator bg-panel sticky top-0 z-10 border-b transition-shadow duration-200",
                scrollState.top &&
                  "shadow-[-4px_0_20px_-2px_var(--color-popup-outline)]"
              )}
            >
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="section-label px-12 py-7 text-left whitespace-nowrap"
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
                  className={`border-separator hover:bg-ghost-hover border-b ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-12 py-7">
                      {(() => {
                        const val = row[col.key] ?? "";
                        const config = columnConfig?.find(
                          (c) => c.key === col.key
                        );
                        return config?.render ? config.render(val) : val;
                      })()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
