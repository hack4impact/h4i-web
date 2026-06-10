"use client";

import { useState, useMemo } from "react";
import { FilterBar } from "../FilterBar";
import { FilteredGrid } from "../FilteredGrid";
import { VolunteerCard } from "./VolunteerCard";
import type { Volunteer } from "@/lib/types/volunteer";

type Sort =
  | "status-first"
  | "name-asc"
  | "name-desc"
  | "grad-asc"
  | "grad-desc";

const SORT_OPTIONS = [
  { value: "status-first", label: "Active first" },
  { value: "name-asc", label: "A–Z" },
  { value: "name-desc", label: "Z–A" },
  { value: "grad-asc", label: "Grad year ↑" },
  { value: "grad-desc", label: "Grad year ↓" },
];

const STATUS_ORDER: Record<string, number> = {
  Active: 0,
  Alumni: 1,
};

interface VolunteersTableProps {
  volunteers: Volunteer[];
}

export function VolunteersTable({ volunteers }: VolunteersTableProps) {
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [chapter, setChapter] = useState("all");
  const [sort, setSort] = useState<Sort>("status-first");

  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    let hasNone = false;
    for (const v of volunteers) {
      if (v.status) statuses.add(v.status);
      else hasNone = true;
    }
    return [
      { value: "all", label: "All" },
      ...Array.from(statuses)
        .sort((a, b) => (STATUS_ORDER[a] ?? 99) - (STATUS_ORDER[b] ?? 99))
        .map((s) => ({ value: s, label: s })),
      ...(hasNone ? [{ value: "__none__", label: "None" }] : []),
    ];
  }, [volunteers]);

  const roleOptions = useMemo(() => {
    const roles = new Set<string>();
    for (const v of volunteers) {
      for (const r of v.roles) roles.add(r);
    }
    return [
      { value: "all", label: "All" },
      ...Array.from(roles)
        .sort()
        .map((r) => ({ value: r, label: r })),
    ];
  }, [volunteers]);

  const chapterOptions = useMemo(() => {
    const chapters = new Set<string>();
    let hasNone = false;
    for (const v of volunteers) {
      if (v.chapter) chapters.add(v.chapter);
      else hasNone = true;
    }
    return [
      { value: "all", label: "All" },
      ...Array.from(chapters)
        .sort()
        .map((c) => ({ value: c, label: c })),
      ...(hasNone ? [{ value: "__none__", label: "None" }] : []),
    ];
  }, [volunteers]);

  const filtered = useMemo(() => {
    let list = [...volunteers];

    if (status === "__none__") list = list.filter((v) => !v.status);
    else if (status !== "all") list = list.filter((v) => v.status === status);

    if (role !== "all") list = list.filter((v) => v.roles.includes(role));

    if (chapter === "__none__") list = list.filter((v) => !v.chapter);
    else if (chapter !== "all")
      list = list.filter((v) => v.chapter === chapter);

    list.sort((a, b) => {
      if (sort === "status-first") {
        const sa = STATUS_ORDER[a.status ?? ""] ?? 99;
        const sb = STATUS_ORDER[b.status ?? ""] ?? 99;
        return sa !== sb ? sa - sb : a.name.localeCompare(b.name);
      }
      if (sort === "name-asc") return a.name.localeCompare(b.name);
      if (sort === "name-desc") return b.name.localeCompare(a.name);
      if (sort === "grad-asc") {
        if (!a.gradYear && !b.gradYear) return a.name.localeCompare(b.name);
        if (!a.gradYear) return 1;
        if (!b.gradYear) return -1;
        return a.gradYear !== b.gradYear
          ? a.gradYear - b.gradYear
          : a.name.localeCompare(b.name);
      }
      if (sort === "grad-desc") {
        if (!a.gradYear && !b.gradYear) return a.name.localeCompare(b.name);
        if (!a.gradYear) return 1;
        if (!b.gradYear) return -1;
        return a.gradYear !== b.gradYear
          ? b.gradYear - a.gradYear
          : a.name.localeCompare(b.name);
      }
      return 0;
    });

    return list;
  }, [volunteers, status, role, chapter, sort]);

  const filters = [
    {
      label: "Status",
      value: status,
      onValueChange: setStatus,
      options: statusOptions,
    },
    {
      label: "Role",
      value: role,
      onValueChange: setRole,
      options: roleOptions,
    },
    {
      label: "Chapter",
      value: chapter,
      onValueChange: setChapter,
      options: chapterOptions,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FilterBar
        filters={filters}
        sort={{
          label: "Sort",
          value: sort,
          onValueChange: (v) => setSort(v as Sort),
          options: SORT_OPTIONS,
        }}
      />

      <FilteredGrid
        items={filtered}
        filterKey={`${status}|${role}|${chapter}|${sort}`}
        gridClassName="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        emptyMessage="No volunteers match the selected filters."
        renderItem={(volunteer) => <VolunteerCard volunteer={volunteer} />}
        estimatedItemHeight={110}
        scrollable
      />
    </div>
  );
}
