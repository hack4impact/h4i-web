"use client";

import { useState, useMemo } from "react";
import { FilterBar } from "../FilterBar";
import { FilteredGrid } from "../FilteredGrid";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/lib/types/project";

type Sort = "year-desc" | "year-asc" | "name-asc" | "name-desc";

const SORT_OPTIONS = [
  { value: "year-desc", label: "Newest first" },
  { value: "year-asc", label: "Oldest first" },
  { value: "name-asc", label: "A–Z" },
  { value: "name-desc", label: "Z–A" },
];

interface ProjectsTableProps {
  projects: Project[];
  hideChapterFilter?: boolean;
}

export function ProjectsTable({
  projects,
  hideChapterFilter = false,
}: ProjectsTableProps) {
  const [focusArea, setFocusArea] = useState("all");
  const [chapter, setChapter] = useState("all");
  const [year, setYear] = useState("all");
  const [sort, setSort] = useState<Sort>("year-desc");

  const focusAreaOptions = useMemo(() => {
    const tags = new Set<string>();
    let hasNone = false;
    for (const p of projects) {
      if (p.tag) tags.add(p.tag);
      else hasNone = true;
    }
    return [
      { value: "all", label: "All" },
      ...Array.from(tags)
        .sort()
        .map((t) => ({ value: t, label: t })),
      ...(hasNone ? [{ value: "__none__", label: "None" }] : []),
    ];
  }, [projects]);

  const chapterOptions = useMemo(() => {
    const chapters = new Set<string>();
    let hasNone = false;
    for (const p of projects) {
      if (p.chapter) chapters.add(p.chapter);
      else hasNone = true;
    }
    return [
      { value: "all", label: "All" },
      ...Array.from(chapters)
        .sort()
        .map((c) => ({ value: c, label: c })),
      ...(hasNone ? [{ value: "__none__", label: "None" }] : []),
    ];
  }, [projects]);

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    let hasNone = false;
    for (const p of projects) {
      if (p.year) years.add(p.year);
      else hasNone = true;
    }
    return [
      { value: "all", label: "All" },
      ...Array.from(years)
        .sort((a, b) => b.localeCompare(a))
        .map((y) => ({ value: y, label: y })),
      ...(hasNone ? [{ value: "__none__", label: "None" }] : []),
    ];
  }, [projects]);

  const filtered = useMemo(() => {
    let list = [...projects];
    if (focusArea === "__none__") list = list.filter((p) => !p.tag);
    else if (focusArea !== "all")
      list = list.filter((p) => p.tag === focusArea);
    if (chapter === "__none__") list = list.filter((p) => !p.chapter);
    else if (chapter !== "all")
      list = list.filter((p) => p.chapter === chapter);
    if (year === "__none__") list = list.filter((p) => !p.year);
    else if (year !== "all") list = list.filter((p) => p.year === year);

    list.sort((a, b) => {
      if (sort === "year-desc") {
        if (!a.year && !b.year) return a.title.localeCompare(b.title);
        if (!a.year) return 1;
        if (!b.year) return -1;
        const diff = b.year.localeCompare(a.year);
        return diff !== 0 ? diff : a.title.localeCompare(b.title);
      }
      if (sort === "year-asc") {
        if (!a.year && !b.year) return a.title.localeCompare(b.title);
        if (!a.year) return 1;
        if (!b.year) return -1;
        const diff = a.year.localeCompare(b.year);
        return diff !== 0 ? diff : a.title.localeCompare(b.title);
      }
      if (sort === "name-asc") return a.title.localeCompare(b.title);
      return b.title.localeCompare(a.title);
    });

    return list;
  }, [projects, focusArea, chapter, year, sort]);

  const filters = [
    {
      label: "Focus Area",
      value: focusArea,
      onValueChange: setFocusArea,
      options: focusAreaOptions,
    },
    ...(!hideChapterFilter
      ? [
          {
            label: "Chapter",
            value: chapter,
            onValueChange: setChapter,
            options: chapterOptions,
          },
        ]
      : []),
    {
      label: "Year",
      value: year,
      onValueChange: setYear,
      options: yearOptions,
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
        filterKey={`${focusArea}|${chapter}|${year}|${sort}`}
        gridClassName="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        emptyMessage="No projects match the selected filters."
        renderItem={(project) => <ProjectCard project={project} />}
        scrollable
      />
    </div>
  );
}
