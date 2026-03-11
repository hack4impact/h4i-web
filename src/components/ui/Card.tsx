import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[6px] border border-border bg-card p-6",
        className
      )}
      {...props}
    />
  );
}

export function CardDivider({
  className,
  ...props
}: HTMLAttributes<HTMLHRElement>) {
  return (
    <hr className={cn("border-t border-divider", className)} {...props} />
  );
}
