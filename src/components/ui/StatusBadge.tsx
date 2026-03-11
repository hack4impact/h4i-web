import { cn } from "@/lib/utils";

export type Status =
  | "Active"
  | "Forming"
  | "Scoping"
  | "Inactive"
  | "Complete"
  | "Hiatus";

const styles: Record<Status, string> = {
  Active: "bg-[#EBF5E4] text-[#2B9212]",
  Forming: "bg-brand-ring text-brand",
  Scoping: "bg-brand-ring text-brand",
  Inactive: "bg-canvas text-text-secondary",
  Complete: "bg-canvas text-text-secondary",
  Hiatus: "bg-[#FEF3C7] text-[#D97706]",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-[7px] py-[2px] text-[10px] leading-3 font-medium",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}
