"use client";

import { Select } from "@base-ui/react/select";
import { cn } from "@/lib/utils";

interface FilterSelectProps {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  align?: "start" | "end";
}

export function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  align = "start",
}: FilterSelectProps) {
  return (
    <Select.Root value={value} onValueChange={(v) => onValueChange(v ?? "all")}>
      <Select.Trigger className="select-trigger label-xs bg-root">
        <span className="text-gray-2">{label}</span>
        <span className="text-gray-4">|</span>
        <Select.Value />
        <Select.Icon className="text-gray-2">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          sideOffset={6}
          align={align}
          alignItemWithTrigger={false}
          positionMethod="fixed"
          className="z-50"
        >
          <Select.Popup
            className={cn(
              "select-popup",
              "select-popup-panel",
              "min-w-[var(--anchor-width)]"
            )}
          >
            <div className="max-h-[220px] overflow-y-auto py-1.5">
              {options.map((opt) => (
                <Select.Item
                  key={opt.value}
                  value={opt.value}
                  className="select-item"
                >
                  <Select.ItemText>{opt.label}</Select.ItemText>
                </Select.Item>
              ))}
            </div>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
