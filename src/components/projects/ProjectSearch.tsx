"use client";

import { useState } from "react";

type Chapter = { id: string; name: string };
export function ProjectSearch({
  value,
  onChange,
  chapters,
  onSelectChapter,
}: {
  value: string;
  onChange: (value: string) => void;
  chapters: Chapter[];
  onSelectChapter: (chapter: Chapter) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const suggestions = value.trim()
    ? chapters
        .filter((chapter) =>
          chapter.name
            .toLocaleLowerCase()
            .includes(value.trim().toLocaleLowerCase())
        )
        .slice(0, 8)
    : [];
  const open = focused && suggestions.length > 0;
  function select(chapter: Chapter) {
    onSelectChapter(chapter);
    setFocused(false);
    setActive(-1);
  }
  return (
    <div className="relative space-y-6">
      <label htmlFor="project-search">Search projects</label>
      <div className="flex gap-8">
        <input
          id="project-search"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? "project-chapter-suggestions" : undefined}
          aria-activedescendant={
            open && active >= 0 ? `project-chapter-option-${active}` : undefined
          }
          aria-describedby="project-search-help"
          autoComplete="off"
          maxLength={200}
          value={value}
          placeholder="Search projects, partners, tags, or chapters…"
          className="border-control-border bg-control focus-visible:outline-focus rounded-4 h-40 w-full min-w-0 border px-12 focus-visible:outline-2"
          onChange={(event) => {
            onChange(event.target.value);
            setFocused(true);
            setActive(-1);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setFocused(false);
              setActive(-1);
              return;
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              if (!suggestions.length) return;
              event.preventDefault();
              setFocused(true);
              setActive((previous) =>
                event.key === "ArrowDown"
                  ? (previous + 1) % suggestions.length
                  : previous <= 0
                    ? suggestions.length - 1
                    : previous - 1
              );
            }
            if (
              event.key === "Enter" &&
              open &&
              active >= 0 &&
              suggestions[active]
            ) {
              event.preventDefault();
              select(suggestions[active]);
            }
          }}
        />
        {value && (
          <button
            type="button"
            className="btn h-40"
            onClick={() => onChange("")}
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>
      <p id="project-search-help" className="text-gray-3">
        Search updates as you type. Choose a chapter suggestion to filter by
        chapter.
      </p>
      {open && (
        <ul
          id="project-chapter-suggestions"
          role="listbox"
          aria-label="Chapter suggestions"
          className="border-separator bg-root rounded-6 absolute top-64 z-10 max-h-240 w-full overflow-y-auto border p-4 shadow-lg"
        >
          {suggestions.map((chapter, index) => (
            <li key={chapter.id} role="presentation">
              <button
                id={`project-chapter-option-${index}`}
                type="button"
                role="option"
                aria-selected={index === active}
                tabIndex={-1}
                className={`rounded-4 hover:bg-panel w-full px-12 py-10 text-left ${index === active ? "bg-panel" : ""}`}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => select(chapter)}
              >
                {chapter.name} <span className="text-gray-3">· Chapter</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
