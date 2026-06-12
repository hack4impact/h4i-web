"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { type SelectOption } from "@/components/ui/Select";

export type { SelectOption };

export function ClearButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="Clear"
      onClick={onClick}
      className={cn(
        "text-gray-4 hover:text-gray-2 absolute top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded transition-colors",
        className ?? "right-2.5"
      )}
    >
      <X size={10} />
    </button>
  );
}
