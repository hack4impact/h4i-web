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
        <div className="border-separator border-b bg-(--color-panel-header) px-24 py-12 font-medium">
          {heading}
        </div>
      )}
      {children}
    </div>
  );
}

// Row is a horizontal container. Put one or many InfoCardField inside.
// Multiple fields sit side-by-side with vertical dividers between them.
type InfoCardRowProps = {
  children: ReactNode;
  className?: string;
};

export function InfoCardRow({ children, className }: InfoCardRowProps) {
  return (
    <div
      className={cn(
        "bg-panel border-separator flex border-b last:border-0",
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
        "border-separator flex flex-1 flex-col gap-4 px-24 py-16 [&:not(:first-child)]:border-l",
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
        "bg-panel-header border-separator border-b px-24",
        variant === "section" && "py-12 font-medium",
        variant === "subsection" && "text-gray-2 py-10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
