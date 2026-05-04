import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

type InfoCardProps = {
  heading?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function InfoCard({ heading, children, className }: InfoCardProps) {
  return (
    <div
      className={cn(
        "border-separator rounded-4 overflow-hidden border",
        className
      )}
    >
      {heading && (
        <div className="border-separator bg-panel-header border-b px-12 py-6 font-medium">
          {heading}
        </div>
      )}
      {children}
    </div>
  );
}

// Row is a horizontal container. Put one or many InfoCardField inside.
// layout="equal" (default): fields share width evenly.
// layout="auto": fields shrink-wrap to their content width.
type InfoCardRowProps = {
  children: ReactNode;
  layout?: "equal" | "auto";
  className?: string;
};

export function InfoCardRow({
  children,
  layout = "equal",
  className,
}: InfoCardRowProps) {
  return (
    <div
      className={cn(
        "bg-panel border-separator flex border-b last:border-0",
        layout === "equal" && "*:flex-1",
        className
      )}
    >
      {children}
    </div>
  );
}

// Field is a single cell within a row. Optional label sits above the content.
type InfoCardFieldProps = {
  label?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function InfoCardField({
  label,
  children,
  className,
}: InfoCardFieldProps) {
  return (
    <div
      className={cn(
        "border-separator flex flex-col gap-4 px-12 py-16 not-first:border-l",
        className
      )}
    >
      {label && <div className="text-gray-2">{label}</div>}
      <div>{children}</div>
    </div>
  );
}

type InfoCardSectionHeaderProps = {
  children: ReactNode;
  variant?: "section" | "subsection";
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

export function InfoCardSectionHeader({
  children,
  variant = "section",
  className,
  ...props
}: InfoCardSectionHeaderProps) {
  return (
    <div
      className={cn(
        "bg-panel-header border-separator border-b px-12 py-6",
        variant === "section" && "font-medium",
        variant === "subsection" && "text-gray-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
