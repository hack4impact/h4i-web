"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "dark";

type ButtonProps = Omit<
  ComponentPropsWithoutRef<typeof BaseButton>,
  "className"
> & {
  variant?: Variant;
  className?: string;
};

const variantClasses: Record<Variant, string> = {
  primary: "bg-(--accent) text-white hover:bg-(--accent-hover)",
  secondary: "border border-(--border) hover:bg-(--hover-bg)",
  ghost: "hover:bg-(--hover-bg)",
  dark: "bg-(--btn-dark-bg) text-(--btn-dark-fg) hover:bg-(--btn-dark-hover-bg)",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      className={cn(
        "inline-flex cursor-pointer items-center justify-center",
        variant !== "ghost" && "h-8 px-3",
        variantClasses[variant],
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
