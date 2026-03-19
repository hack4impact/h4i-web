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
        "disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}
