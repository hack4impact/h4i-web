"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode, ComponentPropsWithoutRef } from "react";

// Root and Trigger are re-exported as-is — callers style triggers themselves.
export const MenuRoot = BaseMenu.Root;
export const MenuTrigger = BaseMenu.Trigger;
export const MenuRadioGroup = BaseMenu.RadioGroup;

// MenuContent bundles Portal → Positioner → Popup so callers skip the boilerplate.
type MenuContentProps = {
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
};

export function MenuContent({
  children,
  side = "bottom",
  align = "end",
  sideOffset = 4,
  className,
}: MenuContentProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="z-50"
      >
        <BaseMenu.Popup className={cn("menu-popup", className)}>
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export function MenuItem({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseMenu.Item>) {
  return (
    <BaseMenu.Item
      className={cn("menu-item text-left select-none", className)}
      {...props}
    />
  );
}

export function MenuLinkItem({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseMenu.LinkItem>) {
  return (
    <BaseMenu.LinkItem
      className={cn("menu-item text-left select-none", className)}
      {...props}
    />
  );
}

// CheckboxItem bakes in the checkbox box and indicator — children is the label.
export function MenuCheckboxItem({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseMenu.CheckboxItem>) {
  return (
    <BaseMenu.CheckboxItem
      className={cn("menu-item gap-8 text-left select-none", className)}
      {...props}
    >
      <span className="border-checkbox-outline flex h-14 w-14 shrink-0 items-center justify-center border">
        <BaseMenu.CheckboxItemIndicator>
          <Check size={10} strokeWidth={2.5} />
        </BaseMenu.CheckboxItemIndicator>
      </span>
      <span>{children}</span>
    </BaseMenu.CheckboxItem>
  );
}

// RadioItem includes justify-between so a trailing indicator icon composes naturally.
export function MenuRadioItem({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseMenu.RadioItem>) {
  return (
    <BaseMenu.RadioItem
      className={cn(
        "menu-item justify-between gap-16 text-left select-none",
        className
      )}
      {...props}
    />
  );
}

export function MenuSeparator({ className }: { className?: string }) {
  return <div className={cn("menu-separator", className)} />;
}

export function MenuCaption({
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
