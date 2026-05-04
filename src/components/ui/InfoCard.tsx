import { SquareArrowOutUpRight } from "lucide-react";
import { cn, ensureUrl } from "@/lib/utils";
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
// Pass href to make the entire field a clickable link.
type InfoCardFieldProps = {
  label?: ReactNode;
  children: ReactNode;
  href?: string;
  className?: string;
};

export function InfoCardField({
  label,
  children,
  href,
  className,
}: InfoCardFieldProps) {
  const base = cn(
    "border-separator flex flex-col gap-4 px-12 py-16 not-first:border-l",
    href && "hover:bg-panel-highlight-1 cursor-pointer transition-colors",
    className
  );

  const content = (
    <>
      {label && <div className="text-gray-2">{label}</div>}
      <div>{children}</div>
    </>
  );

  if (href) {
    return (
      <a href={href} className={base}>
        {content}
      </a>
    );
  }

  return <div className={base}>{content}</div>;
}

// ContactField: a field cell for contact info.
// Person mode (name provided): shows name + optional subtitle alongside the contact link.
//   layout="stacked" (default): name/subtitle above contact.
//   layout="inline": name/subtitle on the left, contact on the right.
// Label mode (no name): label above contact, same as InfoCardField.
type ContactFieldProps = {
  name?: string;
  subtitle?: string;
  layout?: "stacked" | "inline";
  label?: string;
  contact: string;
  type: "email" | "phone";
  className?: string;
};

export function ContactField({
  name,
  subtitle,
  layout = "stacked",
  label,
  contact,
  type,
  className,
}: ContactFieldProps) {
  const href = type === "email" ? `mailto:${contact}` : `tel:${contact}`;
  const contactLink = (
    <a href={href} className="hover:underline">
      {contact}
    </a>
  );

  return (
    <div
      className={cn(
        "border-separator flex flex-col gap-4 px-12 py-16 not-first:border-l",
        className
      )}
    >
      {name ? (
        layout === "inline" ? (
          <div className="flex items-center justify-between gap-16">
            <div className="flex flex-col gap-2">
              <div className="font-medium">{name}</div>
              {subtitle && <div className="text-gray-2">{subtitle}</div>}
            </div>
            {contactLink}
          </div>
        ) : (
          <>
            <div className="font-medium">{name}</div>
            {subtitle && <div className="text-gray-2">{subtitle}</div>}
            {contactLink}
          </>
        )
      ) : (
        <>
          {label && <div className="text-gray-2">{label}</div>}
          {contactLink}
        </>
      )}
    </div>
  );
}

// ResourceLinkField: an external link rendered as a button-style cell in a row.
// Uses ensureUrl so bare domains (e.g. "github.com/...") are handled safely.
type ResourceLinkFieldProps = {
  label: string;
  href: string;
  className?: string;
};

export function ResourceLinkField({
  label,
  href,
  className,
}: ResourceLinkFieldProps) {
  return (
    <a
      href={ensureUrl(href)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "border-separator flex items-center gap-8 px-12 py-12 transition-colors not-first:border-l hover:bg-(--color-panel-highlight-1)",
        className
      )}
    >
      <SquareArrowOutUpRight
        size={14}
        strokeWidth={1.5}
        className="text-gray-2 shrink-0"
      />
      {label}
    </a>
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
