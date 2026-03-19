import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function CardDivider({
  className,
  ...props
}: HTMLAttributes<HTMLHRElement>) {
  return <hr className={className} {...props} />;
}
