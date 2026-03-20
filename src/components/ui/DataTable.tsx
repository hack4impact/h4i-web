"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
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
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>(
    defaultSort
      ? [{ id: defaultSort.key, desc: defaultSort.dir === "desc" }]
      : []
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columnDefs = useMemo((): ColumnDef<Record<string, string>>[] => {
    const keys = columnsProp?.length
      ? columnsProp.filter((k) => k !== rowKey)
      : Object.keys(data[0] ?? {}).filter((k) => k !== rowKey);

    return keys.map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ getValue }) => {
        const val = getValue<string>() ?? "";
        const config = columnConfig?.find((c) => c.key === key);
        return config?.render ? config.render(val) : val;
      },
      filterFn: (row, columnId, filterValue: Set<string>) =>
        !filterValue?.size || filterValue.has(row.getValue(columnId) ?? ""),
    }));
  }, [columnsProp, data, rowKey, columnConfig]);

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

  const table = useReactTable({
    data,
    columns: columnDefs,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  const activeSortCol = sorting[0]?.id ?? null;
  const activeSortDir = sorting[0]?.desc ? "desc" : "asc";

  const activeFilterCount = columnFilters.length;
  const isFiltered = !!globalFilter.trim() || activeFilterCount > 0;
  const total = data.length;
  const shown = table.getFilteredRowModel().rows.length;
  const noun_plural = (n: number) => `${n} ${n === 1 ? noun : `${noun}s`}`;
  const countLabel = isFiltered
    ? `${shown} of ${noun_plural(total)}`
    : noun_plural(total);

  function cycleSort(key: string) {
    setSorting((prev) => {
      const current = prev[0];
      if (!current || current.id !== key) return [{ id: key, desc: false }];
      if (!current.desc) return [{ id: key, desc: true }];
      return [];
    });
  }

  function toggleFilter(key: string, value: string) {
    setColumnFilters((prev) => {
      const existing = prev.find((f) => f.id === key);
      const set = new Set<string>(
        existing ? (existing.value as Set<string>) : []
      );
      set.has(value) ? set.delete(value) : set.add(value);
      if (!set.size) return prev.filter((f) => f.id !== key);
      return [...prev.filter((f) => f.id !== key), { id: key, value: set }];
    });
  }

  function getFilterSet(key: string): Set<string> {
    const entry = columnFilters.find((f) => f.id === key);
    return entry ? (entry.value as Set<string>) : new Set();
  }

  const visibleColumns = table.getAllColumns();

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
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={`Search ${noun}s...`}
            className="h-8 w-full border border-(--border) bg-(--surface-panel) py-1 pr-3 pl-7 placeholder:text-(--text-secondary) focus:border-(--accent) focus:outline-none"
          />
        </div>

        <Menu.Root modal={false}>
          <Menu.Trigger className={toolbarBtn}>
            <ArrowUpDown size={13} strokeWidth={1} />
            Sort
            {activeSortCol && (
              <span className="text-(--text-secondary)">
                · {activeSortCol} {activeSortDir === "asc" ? "↑" : "↓"}
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
                  <Menu.RadioGroup value={activeSortCol ?? ""}>
                    {visibleColumns.map((col) => {
                      const active = activeSortCol === col.id;
                      return (
                        <Menu.RadioItem
                          key={col.id}
                          value={col.id}
                          closeOnClick={false}
                          onClick={() => cycleSort(col.id)}
                          className={menuItemCls}
                        >
                          {col.id}
                          {active && (
                            <span className="ml-auto text-(--text-secondary)">
                              {activeSortDir === "asc" ? "↑ A→Z" : "↓ Z→A"}
                            </span>
                          )}
                        </Menu.RadioItem>
                      );
                    })}
                  </Menu.RadioGroup>
                </div>
                {activeSortCol && (
                  <>
                    <Menu.Separator className="my-1" />
                    <div className="p-1.5">
                      <Menu.Item
                        onClick={() => setSorting([])}
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
                            checked={getFilterSet(field.key).has(opt)}
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
                          onClick={() => setColumnFilters([])}
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
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="section-label px-3 py-[7px] text-left whitespace-nowrap"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-(--border) hover:bg-(--hover-bg)"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-[7px]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
