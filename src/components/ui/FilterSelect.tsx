"use client";

import { useState } from "react";
import { Select } from "@base-ui/react/select";
import { Combobox } from "@base-ui/react/combobox";
import { addFieldOption } from "@/actions/field-options";
import { cn } from "@/lib/utils";

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
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const isSearching = query.trim() !== "" && query !== selectedValue;
  const filtered = isSearching
    ? localItems.filter((item) =>
        item.toLowerCase().includes(query.toLowerCase())
      )
    : localItems;

  const showPortal = filtered.length > 0 || (allowNew && Boolean(query.trim()));

  function handleValueChange(value: string | null) {
    setSelectedValue(value);
    if (
      allowNew &&
      value &&
      !localItems.some((item) => item.toLowerCase() === value.toLowerCase())
    ) {
      setLocalItems((prev) => [...prev, value]);
      if (persistField) {
        addFieldOption(persistField, value).catch(console.error);
      }
    }
  }

  return (
    <Combobox.Root
      onInputValueChange={setQuery}
      onValueChange={handleValueChange}
    >
      <Combobox.Input
        id={id}
        name={name}
        placeholder={placeholder}
        required={required}
        className="input-auth"
        autoComplete="off"
      />
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

  function handleValueChange(value: string | null) {
    if (allowNew && value && !localOptions.some((o) => o.value === value)) {
      setLocalOptions((prev) => [...prev, { value, label: value }]);
    }
  }

  return (
    <Select.Root
      name={name}
      required={required}
      disabled={disabled}
      onValueChange={handleValueChange}
    >
      <Select.Trigger
        className={cn(
          "input-auth flex w-full items-center justify-between text-left",
          "[&_[data-placeholder]]:text-gray-4"
        )}
      >
        <Select.Value placeholder={placeholder} className="flex-1 truncate">
          {(value: string | null) =>
            value
              ? (localOptions.find((o) => o.value === value)?.label ?? value)
              : null
          }
        </Select.Value>
        <Select.Icon className="text-gray-3 ml-2 shrink-0">
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
