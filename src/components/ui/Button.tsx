"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";

import { cn } from "@/lib/utils";

function Button({ className, ...props }: ButtonPrimitive.Props) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        "inline-flex h-36 shrink-0 cursor-default items-center justify-center gap-6 rounded-md border border-transparent bg-clip-padding px-10 text-sm font-medium whitespace-nowrap select-none",
        "bg-gray-1 text-gray-1-dark hover:bg-gray-1/80",
        "transition-all outline-none active:translate-y-px",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-3",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-16",
        className
      )}
      {...props}
    />
  );
}

export { Button };
