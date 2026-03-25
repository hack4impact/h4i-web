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
        "font-caption inline-flex h-16 items-center border border-black/10 px-4 text-[11px]/16 dark:border-white/10",
        colorClasses[color]
      )}
    >
      {label}
    </span>
  );
}
