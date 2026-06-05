"use client";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode, ComponentPropsWithoutRef } from "react";

// Root, Group, GroupLabel re-exported as-is.
export const ComboboxRoot = BaseCombobox.Root;
export const ComboboxGroup = BaseCombobox.Group;
export const ComboboxGroupLabel = BaseCombobox.GroupLabel;

// ComboboxInputGroup wraps the input + optional trigger button in a single bordered row.
export function ComboboxInputGroup({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseCombobox.InputGroup>) {
  return (
    <BaseCombobox.InputGroup
      className={cn(
        "border-separator rounded-6 flex h-32 items-center border",
        className
      )}
      {...props}
    />
  );
}

// ComboboxInput is the text input inside InputGroup. No border of its own — inherited from the group.
export function ComboboxInput({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseCombobox.Input>) {
  return (
    <BaseCombobox.Input
      className={cn(
        "h-full min-w-0 flex-1 bg-transparent py-4 pr-4 pl-10 placeholder:text-(--color-gray-3) focus:outline-none",
        className
      )}
      {...props}
    />
  );
}

// ComboboxTrigger is the optional chevron button on the right side of the input group.
export function ComboboxTrigger({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseCombobox.Trigger>) {
  return (
    <BaseCombobox.Trigger
      className={cn(
        "text-gray-3 flex h-full w-28 shrink-0 items-center justify-center",
        className
      )}
      {...props}
    />
  );
}

// ComboboxContent bundles Portal → Positioner → Popup. Put ComboboxList (with render prop) inside.
type ComboboxContentProps = {
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
};

export function ComboboxContent({
  children,
  side = "bottom",
  align = "start",
  sideOffset = 4,
  className,
}: ComboboxContentProps) {
  return (
    <BaseCombobox.Portal>
      <BaseCombobox.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="z-50"
      >
        <BaseCombobox.Popup className={cn("menu-popup", className)}>
          {children}
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}

// ComboboxList renders filtered items. Pass a render function as children — Base UI
// automatically filters based on the current input value when items are passed to ComboboxRoot.
export function ComboboxList({
  children,
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof BaseCombobox.List>, "children"> & {
  children: ((item: unknown, index: number) => ReactNode) | ReactNode;
}) {
  return (
    <BaseCombobox.List className={cn(className)} {...props}>
      {
        children as ComponentPropsWithoutRef<
          typeof BaseCombobox.List
        >["children"]
      }
    </BaseCombobox.List>
  );
}

// ComboboxItem with a left-side checkmark slot — same layout as SelectItem.
export function ComboboxItem({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseCombobox.Item>) {
  return (
    <BaseCombobox.Item
      className={cn("menu-item gap-8 select-none", className)}
      {...props}
    >
      <span className="flex w-14 shrink-0 items-center justify-center">
        <BaseCombobox.ItemIndicator>
          <Check size={13} strokeWidth={2.5} />
        </BaseCombobox.ItemIndicator>
      </span>
      <span>{children}</span>
    </BaseCombobox.Item>
  );
}

// ComboboxEmpty is shown when the filtered list has no results.
export function ComboboxEmpty({
  children = "No results.",
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseCombobox.Empty>) {
  return (
    <BaseCombobox.Empty
      className={cn("text-gray-3 px-12 py-10", className)}
      {...props}
    >
      {children}
    </BaseCombobox.Empty>
  );
}

export function ComboboxSeparator({ className }: { className?: string }) {
  return <div className={cn("menu-separator", className)} />;
}

export function ComboboxCaption({
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
