"use client";

import { useState } from "react";
import { Select } from "@base-ui/react/select";
import { Combobox } from "@base-ui/react/combobox";
import { addFieldOption } from "@/actions/field-options";
import { cn } from "@/lib/utils";
import { type SelectOption } from "@/components/ui/FilterSelect";

export type { SelectOption };

const XIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path
      d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

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

export function ClearButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="Clear"
      onClick={onClick}
      className={cn(
        "text-gray-4 hover:text-gray-2 absolute top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded transition-colors",
        className ?? "right-2.5"
      )}
    >
      <XIcon />
    </button>
  );
}

function SelectPopup({
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
            ) : allowNew && query.trim() ? (
              <Select.Item value={query.trim()} className="select-item">
                <Select.ItemText>
                  Add &ldquo;{query.trim()}&rdquo;
                </Select.ItemText>
              </Select.Item>
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

export interface AppComboboxProps {
  id?: string;
  name?: string;
  options: string[];
  placeholder?: string;
  required?: boolean;
  allowNew?: boolean;
  persistField?: string;
}

export function AppCombobox({
  id,
  name,
  options,
  placeholder,
  required,
  allowNew = false,
  persistField,
}: AppComboboxProps) {
  const [localItems, setLocalItems] = useState<string[]>(options);
  const [query, setQuery] = useState("");
  const [value, setValue] = useState<string | null>(null);

  const isSearching = query.trim() !== "" && query !== value;
  const filtered = isSearching
    ? localItems.filter((item) =>
        item.toLowerCase().includes(query.toLowerCase())
      )
    : localItems;

  const showPortal = filtered.length > 0 || (allowNew && Boolean(query.trim()));

  function handleValueChange(v: string | null) {
    setValue(v);
    if (
      allowNew &&
      v &&
      !localItems.some((item) => item.toLowerCase() === v.toLowerCase())
    ) {
      setLocalItems((prev) => [...prev, v]);
      if (persistField) {
        addFieldOption(persistField, v).catch(console.error);
      }
    }
  }

  function handleClear() {
    setValue(null);
    setQuery("");
  }

  return (
    <Combobox.Root
      value={value}
      onInputValueChange={setQuery}
      onValueChange={handleValueChange}
    >
      <div className="relative">
        <Combobox.Input
          id={id}
          name={name}
          placeholder={placeholder}
          required={required}
          className={cn("input-auth", value && "pr-9")}
          autoComplete="off"
        />
        {value && <ClearButton onClick={handleClear} />}
      </div>
      {showPortal && (
        <Combobox.Portal>
          <Combobox.Positioner
            sideOffset={6}
            align="start"
            positionMethod="fixed"
            className="z-50"
          >
            <Combobox.Popup className="select-popup select-popup-panel min-w-[var(--anchor-width)]">
              <Combobox.List className="max-h-[220px] overflow-y-auto py-1">
                {filtered.map((item) => (
                  <Combobox.Item
                    key={item}
                    value={item}
                    className="select-item"
                  >
                    {item}
                  </Combobox.Item>
                ))}
                {filtered.length === 0 &&
                  query.trim() &&
                  (allowNew ? (
                    <Combobox.Item value={query.trim()} className="select-item">
                      Add &ldquo;{query.trim()}&rdquo;
                    </Combobox.Item>
                  ) : (
                    <p className="select-item cursor-default opacity-50">
                      No results
                    </p>
                  ))}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      )}
    </Combobox.Root>
  );
}

export interface AppSelectProps {
  name: string;
  options: SelectOption[];
  placeholder?: string;
  align?: "start" | "end";
  searchable?: boolean;
  required?: boolean;
  disabled?: boolean;
  allowNew?: boolean;
}

export function AppSelect({
  name,
  options,
  placeholder = "Select…",
  align = "start",
  searchable,
  required,
  disabled,
  allowNew,
}: AppSelectProps) {
  const [localOptions, setLocalOptions] = useState(options);
  const [value, setValue] = useState<string | null>(null);

  function handleValueChange(v: string | null) {
    setValue(v);
    if (allowNew && v && !localOptions.some((o) => o.value === v)) {
      setLocalOptions((prev) => [...prev, { value: v, label: v }]);
    }
  }

  return (
    <Select.Root
      name={name}
      value={value}
      required={required}
      disabled={disabled}
      onValueChange={handleValueChange}
    >
      <Select.Trigger
        className={cn(
          "input-auth flex w-full items-center gap-2 text-left",
          "[&_[data-placeholder]]:text-gray-4"
        )}
      >
        <Select.Value placeholder={placeholder} className="flex-1 truncate">
          {(v: string | null) =>
            v ? (localOptions.find((o) => o.value === v)?.label ?? v) : null
          }
        </Select.Value>
        {value && (
          <div
            role="button"
            tabIndex={-1}
            aria-label="Clear"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              setValue(null);
            }}
            className="text-gray-4 hover:text-gray-2 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded transition-colors"
          >
            <XIcon />
          </div>
        )}
        <Select.Icon className="text-gray-3 shrink-0">
          <Chevron />
        </Select.Icon>
      </Select.Trigger>
      <SelectPopup
        options={localOptions}
        align={align}
        searchable={searchable}
        allowNew={allowNew}
      />
    </Select.Root>
  );
}
