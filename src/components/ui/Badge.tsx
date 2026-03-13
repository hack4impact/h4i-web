import { cn } from "@/lib/utils";

export type BadgeColor =
  | "blue"
  | "purple"
  | "pink"
  | "orange"
  | "green"
  | "grey";

const colorStyles: Record<BadgeColor, string> = {
  blue: "bg-blue-50 text-blue-600",
  purple: "bg-purple-50 text-purple-600",
  pink: "bg-pink-50 text-pink-600",
  orange: "bg-orange-50 text-orange-600",
  green: "bg-green-50 text-green-600",
  grey: "bg-canvas text-text-secondary",
};

export function Badge({ label, color }: { label: string; color: BadgeColor }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-[7px] py-[2px] text-sm font-medium",
        colorStyles[color]
      )}
    >
      {label}
    </span>
  );
}
