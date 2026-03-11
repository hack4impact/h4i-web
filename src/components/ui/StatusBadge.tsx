import { cn } from "@/lib/utils";

export type Status =
  | "Active"
  | "Forming"
  | "Scoping"
  | "Inactive"
  | "Complete"
  | "Hiatus";

const styles: Record<Status, string> = {
  Active: "bg-green-50 text-green-500",
  Forming: "bg-blue-50 text-blue-500",
  Scoping: "bg-blue-50 text-blue-500",
  Inactive: "bg-canvas text-text-secondary",
  Complete: "bg-canvas text-text-secondary",
  Hiatus: "bg-orange-50 text-orange-500",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-[7px] py-[2px] text-sm font-medium",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}
