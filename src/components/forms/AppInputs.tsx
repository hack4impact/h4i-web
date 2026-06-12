"use client";

import { useState } from "react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Combobox } from "@base-ui/react/combobox";
import { addFieldOption } from "@/actions/field-options";
import { cn } from "@/lib/utils";
import { X, ChevronDown } from "lucide-react";
import { SelectPopup, type SelectOption } from "@/components/ui/Select";

export type { SelectOption };

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
      <X size={10} />
    </button>
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

  const showPortal = filtered.length > 0 || Boolean(query.trim());

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
        <Combobox.Clear
          aria-label="Clear"
          className="text-gray-4 hover:text-gray-2 absolute top-1/2 right-2.5 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded transition-colors"
        >
          <X size={10} />
        </Combobox.Clear>
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
    <BaseSelect.Root
      name={name}
      value={value}
      required={required}
      disabled={disabled}
      onValueChange={handleValueChange}
    >
      <BaseSelect.Trigger
        className={cn(
          "input-auth flex w-full items-center gap-2 text-left",
          "[&_[data-placeholder]]:text-gray-4"
        )}
      >
        <BaseSelect.Value placeholder={placeholder} className="flex-1 truncate">
          {(v: string | null) =>
            v ? (localOptions.find((o) => o.value === v)?.label ?? v) : null
          }
        </BaseSelect.Value>
        {value && (
          <button
            type="button"
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
            <X size={10} />
          </button>
        )}
        <BaseSelect.Icon className="text-gray-3 shrink-0">
          <ChevronDown size={10} />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <SelectPopup
        options={localOptions}
        align={align}
        searchable={searchable}
        allowNew={allowNew}
      />
    </BaseSelect.Root>
  );
}
