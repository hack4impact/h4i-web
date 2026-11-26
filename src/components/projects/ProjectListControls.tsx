"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  projectSortLabels,
  projectLengthLabels,
  projectsUrl,
  type ProjectListQuery,
} from "@/lib/projects/sort";
import { stages } from "@/lib/projects/validation";
const control =
  "border-separator bg-control min-h-44 w-full rounded-4 border px-8 focus-visible:outline-2 focus-visible:outline-focus";

export function ProjectListControls({
  query,
  chapters,
  impactAreas,
}: {
  query: ProjectListQuery;
  chapters: { id: string; name: string }[];
  impactAreas: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const restoreFocus = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  useEffect(() => {
    if (search.current && document.activeElement !== search.current)
      search.current.value = query.q ?? "";
    if (restoreFocus.current) {
      search.current?.focus();
      restoreFocus.current = false;
    }
  }, [
    query.q,
    query.chapter_id,
    query.stage,
    query.project_length,
    query.impact_area,
  ]);
  function apply() {
    if (timer.current) clearTimeout(timer.current);
    if (!form.current) return;
    const values = Object.fromEntries(new FormData(form.current)) as Record<
      string,
      string
    >;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values))
      if (value.trim()) params.set(key, value.trim());
    startTransition(() =>
      router.replace(`/projects?${params}`, { scroll: false })
    );
  }
  const chips = [
    query.q ? { key: "q" as const, label: `Search: ${query.q}` } : null,
    query.chapter_id
      ? {
          key: "chapter_id" as const,
          label: `Chapter: ${chapters.find((c) => c.id === query.chapter_id)?.name ?? query.chapter_id}`,
        }
      : null,
    query.stage
      ? { key: "stage" as const, label: `Stage: ${query.stage}` }
      : null,
    query.project_length
      ? {
          key: "project_length" as const,
          label: `Length: ${projectLengthLabels[query.project_length]}`,
        }
      : null,
    query.impact_area
      ? { key: "impact_area" as const, label: `Impact: ${query.impact_area}` }
      : null,
  ].filter((chip) => chip !== null);
  return (
    <div className="mb-24 space-y-12">
      <form
        ref={form}
        action="/projects"
        method="get"
        aria-label="Search and filter projects"
        onSubmit={(event) => {
          event.preventDefault();
          apply();
        }}
        className="grid min-w-0 grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3"
      >
        <label className="min-w-0 space-y-6 sm:col-span-2 lg:col-span-3">
          <span className="block">Search projects or chapters</span>
          <input
            ref={search}
            type="search"
            aria-label="Search projects or chapters"
            name="q"
            defaultValue={query.q ?? ""}
            maxLength={200}
            list="project-chapter-suggestions"
            aria-describedby="project-search-help"
            className={control}
            placeholder="Project, chapter, or nonprofit name"
            onChange={() => {
              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(apply, 350);
            }}
          />
          <datalist id="project-chapter-suggestions">
            {chapters.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
          <span id="project-search-help" className="text-gray-3 block text-sm">
            Results update as you type. Chapter names are suggested; you can
            also select a chapter below.
          </span>
        </label>
        <label className="min-w-0 space-y-6">
          <span className="block">Chapter</span>
          <select
            name="chapter_id"
            aria-label="Chapter"
            className={control}
            value={query.chapter_id ?? ""}
            onChange={apply}
          >
            <option value="">All chapters</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 space-y-6">
          <span className="block">Stage</span>
          <select
            name="stage"
            aria-label="Stage"
            className={control}
            value={query.stage ?? ""}
            onChange={apply}
          >
            <option value="">All stages</option>
            {stages.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 space-y-6">
          <span className="block">Project length</span>
          <select
            name="project_length"
            aria-label="Project length"
            className={control}
            value={query.project_length ?? ""}
            onChange={apply}
          >
            <option value="">All lengths</option>
            {Object.entries(projectLengthLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 space-y-6">
          <span className="block">Impact area</span>
          <select
            name="impact_area"
            aria-label="Impact area"
            className={control}
            value={query.impact_area ?? ""}
            onChange={apply}
          >
            <option value="">All impact areas</option>
            {[
              ...new Set([
                ...impactAreas,
                ...(query.impact_area ? [query.impact_area] : []),
              ]),
            ]
              .sort()
              .map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
          </select>
        </label>
        <label className="min-w-0 space-y-6">
          <span className="block">Sort projects</span>
          <select
            name="sort"
            aria-label="Sort projects"
            className={control}
            value={query.sort}
            onChange={apply}
          >
            {Object.entries(projectSortLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <input type="hidden" name="page_size" value={query.page_size} />
        <button type="submit" className="btn min-h-44 self-end">
          Apply filters
        </button>
      </form>
      <p role="status" aria-live="polite" className="text-gray-3 min-h-20">
        {pending ? "Updating projects…" : ""}
      </p>
      {!!chips.length && (
        <div
          aria-label="Active filters"
          className="flex flex-wrap items-center gap-8"
        >
          {chips.map((chip) => (
            <Link
              key={chip.key}
              href={projectsUrl({ ...query, [chip.key]: undefined, page: 1 })}
              className="btn min-h-44 max-w-full break-words"
              aria-label={`Remove ${chip.label}`}
              onClick={() => {
                restoreFocus.current = true;
                if (timer.current) clearTimeout(timer.current);
              }}
            >
              {chip.label} ×
            </Link>
          ))}
          <Link
            href={projectsUrl({ sort: query.sort, page_size: query.page_size })}
            className="btn min-h-44"
            onClick={() => {
              restoreFocus.current = true;
              if (timer.current) clearTimeout(timer.current);
            }}
          >
            Clear filters
          </Link>
        </div>
      )}
    </div>
  );
}
