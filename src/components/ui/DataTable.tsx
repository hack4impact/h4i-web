"use client";

import { useState, useMemo } from "react";
import { Menu } from "@base-ui/react/menu";
import { Input } from "@base-ui/react/input";
import { Search, ArrowUpDown, ListFilter } from "lucide-react";
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
};

const toolbarBtn =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 px-3 hover:bg-(--hover-bg)";

const menuItemCls =
  "flex w-full items-center px-2.5 py-1.5 text-left cursor-default select-none data-[highlighted]:bg-(--hover-bg)";

const menuPopupCls =
  "w-52 border border-(--border) bg-(--surface-raised) p-1 shadow-sm";

const menuPositionerCls = "z-50";

function MenuSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2">
      <span className="section-label">{children}</span>
    </div>
  );
}

export function DataTable({
  data,
  columns: columnsProp,
  rowKey = "id",
  noun = "row",
  filterFields,
  columnConfig,
  defaultSort = null,
}: DataTableProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>(defaultSort);
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});

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
    <div className="flex max-h-full flex-1 flex-col self-start overflow-hidden border border-(--border) bg-(--surface-panel)">
      <div className="flex shrink-0 items-center gap-2 border-b border-(--border) px-3 py-2">
        <span className="whitespace-nowrap text-(--text-secondary)">
          {countLabel}
        </span>

        <div className="relative flex-1">
          <Search
            size={13}
            strokeWidth={1}
            className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${noun}s...`}
            className="h-8 w-full border border-(--border) bg-(--surface-panel) py-1 pr-3 pl-7 placeholder:text-(--text-secondary) focus:border-(--accent) focus:outline-none"
          />
        </div>

        <Menu.Root modal={false}>
          <Menu.Trigger className={toolbarBtn}>
            <ArrowUpDown size={13} strokeWidth={1} />
            Sort
            {sort && (
              <span className="text-(--text-secondary)">
                · {sort.key} {sort.dir === "asc" ? "↑" : "↓"}
              </span>
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
                <MenuSectionLabel>Sort by</MenuSectionLabel>
                <div className="flex flex-col gap-0.5 p-1.5">
                  <Menu.RadioGroup value={sort?.key ?? ""}>
                    {columns.map((col) => {
                      const active = sort?.key === col.key;
                      return (
                        <Menu.RadioItem
                          key={col.key}
                          value={col.key}
                          closeOnClick={false}
                          onClick={() => cycleSort(col.key)}
                          className={menuItemCls}
                        >
                          {col.label}
                          {active && (
                            <span className="ml-auto text-(--text-secondary)">
                              {sort!.dir === "asc" ? "↑ A→Z" : "↓ Z→A"}
                            </span>
                          )}
                        </Menu.RadioItem>
                      );
                    })}
                  </Menu.RadioGroup>
                </div>
                {sort && (
                  <>
                    <Menu.Separator className="my-1" />
                    <div className="p-1.5">
                      <Menu.Item
                        onClick={() => setSort(null)}
                        className={menuItemCls}
                      >
                        Clear sort
                      </Menu.Item>
                    </div>
                  </>
                )}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>

        {filterFields && filterFields.length > 0 && (
          <Menu.Root modal={false}>
            <Menu.Trigger className={toolbarBtn}>
              <ListFilter size={13} strokeWidth={1} />
              Filter
              {activeFilterCount > 0 && (
                <span className="text-(--text-secondary)">
                  · {activeFilterCount}
                </span>
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
                    <div
                      key={field.key}
                      className={cn(i > 0 && "border-t border-(--border)")}
                    >
                      <MenuSectionLabel>{field.label}</MenuSectionLabel>
                      <div className="flex flex-col gap-0.5 p-1.5">
                        {(filterOptions[field.key] ?? []).map((opt) => (
                          <Menu.CheckboxItem
                            key={opt}
                            checked={filters[field.key]?.has(opt) ?? false}
                            onCheckedChange={() => toggleFilter(field.key, opt)}
                            closeOnClick={false}
                            className={cn(menuItemCls, "gap-2")}
                          >
                            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center border border-(--border)">
                              <Menu.CheckboxItemIndicator>
                                ✓
                              </Menu.CheckboxItemIndicator>
                            </span>
                            <span>{opt}</span>
                          </Menu.CheckboxItem>
                        ))}
                      </div>
                    </div>
                  ))}
                  {activeFilterCount > 0 && (
                    <>
                      <Menu.Separator className="my-1" />
                      <div className="p-1.5">
                        <Menu.Item
                          onClick={() => setFilters({})}
                          className={menuItemCls}
                        >
                          Clear filters
                        </Menu.Item>
                      </div>
                    </>
                  )}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        )}
      </div>

      <div className="flex-1 overflow-auto overscroll-none">
        <table className="w-full min-w-max">
          <thead className="sticky top-0 z-10 border-b border-(--border) bg-(--surface-panel)">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="section-label px-3 py-[7px] text-left whitespace-nowrap"
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
                className="border-b border-(--border) hover:bg-(--hover-bg)"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-[7px]">
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
  );
}
