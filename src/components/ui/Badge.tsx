import { cn } from "@/lib/utils";

export type BadgeColor =
  | "blue"
  | "purple"
  | "pink"
  | "orange"
  | "green"
  | "grey";

const colorClasses: Record<BadgeColor, string> = {
  blue: "bg-(--badge-blue-bg) text-(--badge-blue-fg)",
  purple: "bg-(--badge-purple-bg) text-(--badge-purple-fg)",
  pink: "bg-(--badge-pink-bg) text-(--badge-pink-fg)",
  orange: "bg-(--badge-orange-bg) text-(--badge-orange-fg)",
  green: "bg-(--badge-green-bg) text-(--badge-green-fg)",
  grey: "bg-(--badge-grey-bg) text-(--badge-grey-fg)",
};

export function Badge({ label, color }: { label: string; color: BadgeColor }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 items-center px-[6px] text-[11px] font-medium",
        colorClasses[color]
      )}
    >
      {label}
    </span>
  );
}
