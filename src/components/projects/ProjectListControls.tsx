"use client";

import {
  projectSortLabels,
  type ProjectListOptions,
} from "@/lib/projects/sort";
const control =
  "border-separator bg-control h-36 w-full rounded-4 border px-8 focus-visible:outline-2 focus-visible:outline-focus";
export function ProjectListControls({
  sort,
  chapterId,
  chapters,
}: {
  sort: ProjectListOptions["sort"];
  chapterId?: string;
  chapters: { id: string; name: string }[];
}) {
  return (
    <form
      action="/projects"
      method="get"
      aria-label="Project sort and chapter"
      className="mb-20 flex flex-wrap items-end gap-12"
    >
      <label className="min-w-180 space-y-6">
        <span className="block">Chapter</span>
        <select
          name="chapter_id"
          aria-label="Chapter"
          className={control}
          defaultValue={chapterId || ""}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          <option value="">All chapters</option>
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.name}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-180 space-y-6">
        <span className="block">Sort projects</span>
        <select
          name="sort"
          aria-label="Sort projects"
          className={control}
          defaultValue={sort || "last_updated"}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          {Object.entries(projectSortLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn h-36">
        Apply
      </button>
    </form>
  );
}
