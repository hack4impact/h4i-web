"use client";

import { useState } from "react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export function SelectPopup({
  options,
  searchable,
  align = "start",
  allowNew,
}: {
  options: SelectOption[];
  searchable?: boolean;
  align?: "start" | "end";
  allowNew?: boolean;
}) {
  const [query, setQuery] = useState("");
  const visible =
    searchable && query.trim()
      ? options.filter((o) =>
          o.label.toLowerCase().includes(query.toLowerCase())
        )
      : options;

  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        sideOffset={6}
        align={align}
        alignItemWithTrigger={false}
        positionMethod="fixed"
        className="z-50"
      >
        <BaseSelect.Popup className="select-popup select-popup-panel min-w-[var(--anchor-width)]">
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
                <BaseSelect.Item
                  key={opt.value}
                  value={opt.value}
                  className="select-item"
                >
                  <BaseSelect.ItemText>{opt.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))
            ) : allowNew && query.trim() ? (
              <BaseSelect.Item value={query.trim()} className="select-item">
                <BaseSelect.ItemText>
                  Add &ldquo;{query.trim()}&rdquo;
                </BaseSelect.ItemText>
              </BaseSelect.Item>
            ) : (
              <p className="select-item cursor-default opacity-50">
                No results
              </p>
            )}
          </div>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export interface SelectProps {
  value: string;
  onValueChange: (v: string) => void;
  options: SelectOption[];
  label?: string;
  align?: "start" | "end";
  searchable?: boolean;
}

export function Select({
  label,
  value,
  onValueChange,
  options,
  align = "start",
  searchable,
}: SelectProps) {
  return (
    <BaseSelect.Root
      value={value}
      onValueChange={(v) => onValueChange(v ?? "all")}
    >
      <BaseSelect.Trigger className="select-trigger label-xs bg-root">
        {label && (
          <>
            <span className="text-gray-2">{label}</span>
            <span className="text-gray-4">|</span>
          </>
        )}
        <BaseSelect.Value />
        <BaseSelect.Icon className="text-gray-2">
          <ChevronDown size={10} />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <SelectPopup options={options} align={align} searchable={searchable} />
    </BaseSelect.Root>
  );
}
