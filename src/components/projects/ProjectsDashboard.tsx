"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { projectsClient } from "@/lib/projects/client";
import {
  stageLabels,
  lengthLabels,
  type ProjectFilters,
} from "@/lib/projects/filters";
import type { ProjectListResponse } from "@/lib/projects/types";
import { ProjectCard } from "./ProjectCard";
import { ProjectSearch } from "./ProjectSearch";

const initialFilters: ProjectFilters = { page: 1, page_size: 9 };
const selectClass =
  "border-control-border bg-control focus-visible:outline-focus h-36 w-full min-w-0 rounded-4 border px-8 focus-visible:outline-2";

export function ProjectGridLoading() {
  return (
    <div role="status" aria-label="Loading projects">
      <p className="text-gray-3 mb-16">Loading projects…</p>
      <div className="grid grid-cols-1 gap-20 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="border-separator rounded-6 overflow-hidden border motion-safe:animate-pulse"
            aria-hidden="true"
          >
            <div className="bg-panel aspect-[16/9]" />
            <div className="space-y-12 p-16">
              <div className="bg-panel h-20 w-3/4" />
              <div className="bg-panel h-16 w-1/2" />
              <div className="bg-panel h-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectsDashboard() {
  const [filters, setFilters] = useState<ProjectFilters>(initialFilters);
  const [searchText, setSearchText] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = searchText.trim() || undefined;
      setFilters((previous) =>
        previous.q === q ? previous : { ...previous, q, page: 1 }
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: ProjectListResponse;
    error?: string;
  }>({ key: "" });
  const queryKey = JSON.stringify(filters) + retry;
  useEffect(() => {
    const controller = new AbortController();
    projectsClient.list(filters, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key: queryKey, data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setResult((previous) => ({
            key: queryKey,
            data: previous.data,
            error:
              error instanceof Error
                ? error.message
                : "Projects could not be loaded.",
          }));
      }
    );
    return () => controller.abort();
  }, [filters, queryKey]);

  const loading = result.key !== queryKey;
  const data = result.data;
  const activeFilters = [
    {
      key: "q" as const,
      label: filters.q ? `Search: ${filters.q}` : undefined,
    },
    {
      key: "chapter_id" as const,
      label:
        data?.filters.chapters.find(
          (chapter) => chapter.id === filters.chapter_id
        )?.name || filters.chapter_id,
    },
    {
      key: "stage" as const,
      label: filters.stage ? stageLabels[filters.stage] : undefined,
    },
    {
      key: "project_length" as const,
      label: filters.project_length
        ? lengthLabels[filters.project_length]
        : undefined,
    },
    { key: "impact_area" as const, label: filters.impact_area },
  ].filter((filter) => filter.label);
  function updateFilter<K extends keyof ProjectFilters>(
    key: K,
    value: ProjectFilters[K]
  ) {
    if (key === "q" && !value) setSearchText("");
    setFilters((previous) => ({
      ...previous,
      [key]: value || undefined,
      page: 1,
    }));
  }

  function clearAll() {
    setSearchText("");
    setFilters(initialFilters);
  }
  return (
    <div className="space-y-24 px-16 pb-32 sm:px-32">
      <ProjectSearch
        value={searchText}
        onChange={setSearchText}
        chapters={data?.filters.chapters || []}
        onSelectChapter={(chapter) => {
          setSearchText("");
          setFilters((previous) => ({
            ...previous,
            q: undefined,
            chapter_id: chapter.id,
            page: 1,
          }));
        }}
      />
      <details className="border-separator bg-panel rounded-6 border" open>
        <summary className="cursor-pointer px-16 py-12 text-lg">
          Filters{activeFilters.length ? ` (${activeFilters.length})` : ""}
        </summary>
        <div className="grid grid-cols-1 gap-16 p-16 pt-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-6">
            <label htmlFor="project-filter-chapter">Chapter</label>
            <select
              id="project-filter-chapter"
              className={selectClass}
              value={filters.chapter_id || ""}
              onChange={(event) =>
                updateFilter("chapter_id", event.target.value)
              }
            >
              <option value="">All chapters</option>
              {data?.filters.chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-6">
            <label htmlFor="project-filter-stage">Stage</label>
            <select
              id="project-filter-stage"
              className={selectClass}
              value={filters.stage || ""}
              onChange={(event) =>
                updateFilter(
                  "stage",
                  event.target.value as ProjectFilters["stage"]
                )
              }
            >
              <option value="">All stages</option>
              {Object.entries(stageLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-6">
            <label htmlFor="project-filter-length">Project length</label>
            <select
              id="project-filter-length"
              className={selectClass}
              value={filters.project_length || ""}
              onChange={(event) =>
                updateFilter(
                  "project_length",
                  event.target.value as ProjectFilters["project_length"]
                )
              }
            >
              <option value="">Any length</option>
              {Object.entries(lengthLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-6">
            <label htmlFor="project-filter-impact">Impact area</label>
            <select
              id="project-filter-impact"
              className={selectClass}
              value={filters.impact_area || ""}
              onChange={(event) =>
                updateFilter("impact_area", event.target.value)
              }
            >
              <option value="">All impact areas</option>
              {data?.filters.impactAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>
      </details>
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-8">
          {activeFilters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => updateFilter(key, undefined)}
              className="border-separator bg-panel focus-visible:outline-focus rounded-4 border px-8 py-4 focus-visible:outline-2"
              aria-label={`Remove ${label} filter`}
            >
              {label} <span aria-hidden="true">×</span>
            </button>
          ))}
          <Button variant="ghost" onClick={clearAll}>
            Clear filters
          </Button>
        </div>
      )}
      <div aria-live="polite" aria-atomic="true">
        <p className="text-gray-2">
          {loading
            ? "Updating results…"
            : result.error
              ? "Results unavailable"
              : `Results: ${data?.pagination.total ?? 0}`}
        </p>
      </div>
      {loading ? (
        <ProjectGridLoading />
      ) : result.error ? (
        <div
          role="alert"
          className="border-separator rounded-6 space-y-12 border p-24"
        >
          <p>{result.error}</p>
          <Button onClick={() => setRetry((value) => value + 1)}>
            Try again
          </Button>
          {result.error.includes("sign in") && (
            <a href="/sign-in" className="ml-12 underline">
              Sign in
            </a>
          )}
        </div>
      ) : data && data.projects.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-20 md:grid-cols-2 xl:grid-cols-3">
            {data.projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                chapter={
                  data.filters.chapters.find(
                    (chapter) => chapter.id === project.chapterId
                  )?.name || "Chapter not listed"
                }
              />
            ))}
          </div>
          <nav
            aria-label="Project pagination"
            className="flex flex-wrap items-center justify-between gap-12"
          >
            <p className="text-gray-2">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </p>
            <div className="flex gap-8">
              <Button
                disabled={data.pagination.page <= 1}
                onClick={() =>
                  setFilters((previous) => ({
                    ...previous,
                    page: data.pagination.page - 1,
                  }))
                }
              >
                Previous
              </Button>
              <Button
                disabled={data.pagination.page >= data.pagination.totalPages}
                onClick={() =>
                  setFilters((previous) => ({
                    ...previous,
                    page: data.pagination.page + 1,
                  }))
                }
              >
                Next
              </Button>
            </div>
          </nav>
        </>
      ) : (
        <div className="border-separator rounded-6 border px-24 py-48 text-center">
          <h2 className="text-xl">
            {activeFilters.length
              ? "No projects match your search or filters"
              : "No published projects yet"}
          </h2>
          <p className="text-gray-2 mt-8">
            {activeFilters.length
              ? "Try another search or remove a filter to explore more projects."
              : "Projects will appear here once they are published."}
          </p>
          {activeFilters.length > 0 && (
            <Button className="mt-16" onClick={clearAll}>
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
