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

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-hover active:bg-brand-hover/90 disabled:bg-text-disabled disabled:cursor-not-allowed",
  secondary:
    "bg-card border border-border text-text-primary hover:bg-surface active:bg-canvas disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "text-brand hover:underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  dark: "bg-text-primary text-white hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      className={cn(
        "focus-visible:outline-brand inline-flex cursor-pointer items-center justify-center text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
        variant !== "ghost" && "h-8 rounded-sm px-3",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
