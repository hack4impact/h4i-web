"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode, ComponentPropsWithoutRef } from "react";

// Root, Trigger, Value re-exported as-is — callers style triggers themselves.
export const SelectRoot = BaseSelect.Root;
export const SelectTrigger = BaseSelect.Trigger;
export const SelectValue = BaseSelect.Value;
export const SelectGroup = BaseSelect.Group;

// SelectContent bundles Portal → Positioner (alignItemWithTrigger=false) → Popup
// so the dropdown always opens below the trigger like a menu, not aligned to the selected item.
type SelectContentProps = {
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
};

export function SelectContent({
  children,
  side = "bottom",
  align = "end",
  sideOffset = 4,
  className,
}: SelectContentProps) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignItemWithTrigger={false}
        className="z-50"
      >
        <BaseSelect.Popup className={cn("menu-popup", className)}>
          {children}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

// SelectItem bakes in a left-side checkmark slot. The slot is always present so
// text doesn't shift when an item becomes selected/unselected.
export function SelectItem({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseSelect.Item>) {
  return (
    <BaseSelect.Item
      className={cn("menu-item gap-8 select-none", className)}
      {...props}
    >
      <span className="flex w-14 shrink-0 items-center justify-center">
        <BaseSelect.ItemIndicator>
          <Check size={13} strokeWidth={2.5} />
        </BaseSelect.ItemIndicator>
      </span>
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  );
}

export function SelectSeparator({ className }: { className?: string }) {
  return <div className={cn("menu-separator", className)} />;
}

export function SelectCaption({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("menu-caption text-gray-3", className)}>{children}</div>
  );
}
