import { Separator } from "@base-ui/react/separator";
import { cn } from "@/lib/utils";
import type { HTMLAttributes, ComponentPropsWithoutRef } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function CardDivider({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Separator>) {
  return <Separator className={className} {...props} />;
}
