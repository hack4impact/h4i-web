"use client";

import { useState } from "react";
import { Select } from "@base-ui/react/select";

export interface SelectOption {
  value: string;
  label: string;
}

const Chevron = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
    <path
      d="M3 4.5L6 7.5L9 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function SelectPopup({
  options,
  searchable,
  align = "start",
}: {
  options: SelectOption[];
  searchable?: boolean;
  align?: "start" | "end";
}) {
  const [query, setQuery] = useState("");
  const visible =
    searchable && query.trim()
      ? options.filter((o) =>
          o.label.toLowerCase().includes(query.toLowerCase())
        )
      : options;

  return (
    <Select.Portal>
      <Select.Positioner
        sideOffset={6}
        align={align}
        alignItemWithTrigger={false}
        positionMethod="fixed"
        className="z-50"
      >
        <Select.Popup className="select-popup select-popup-panel min-w-[var(--anchor-width)]">
          {searchable && (
            <div className="px-2 pt-2">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    ![
                      "ArrowUp",
                      "ArrowDown",
                      "Enter",
                      "Escape",
                      "Tab",
                    ].includes(e.key)
                  ) {
                    e.stopPropagation();
                  }
                }}
                placeholder="Search…"
                className="select-search"
              />
            </div>
          )}
          <div className="max-h-[220px] overflow-y-auto py-1">
            {visible.length > 0 ? (
              visible.map((opt) => (
                <Select.Item
                  key={opt.value}
                  value={opt.value}
                  className="select-item"
                >
                  <Select.ItemText>{opt.label}</Select.ItemText>
                </Select.Item>
              ))
            ) : (
              <p className="select-item cursor-default opacity-50">
                No results
              </p>
            )}
          </div>
        </Select.Popup>
      </Select.Positioner>
    </Select.Portal>
  );
}

export interface FilterSelectProps {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: SelectOption[];
  align?: "start" | "end";
  searchable?: boolean;
}

export function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  align = "start",
  searchable,
}: FilterSelectProps) {
  return (
    <Select.Root value={value} onValueChange={(v) => onValueChange(v ?? "all")}>
      <Select.Trigger className="select-trigger label-xs bg-root">
        <span className="text-gray-2">{label}</span>
        <span className="text-gray-4">|</span>
        <Select.Value />
        <Select.Icon className="text-gray-2">
          <Chevron />
        </Select.Icon>
      </Select.Trigger>
      <SelectPopup options={options} align={align} searchable={searchable} />
    </Select.Root>
  );
}
