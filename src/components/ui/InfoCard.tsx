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

// Field is a single cell within a row.
//
// variant="link" (default): the whole cell becomes an <a> when href is provided,
//   with a hover background. icon renders inline with children.
//
// variant="button": the cell is always a <div>; when href is provided a btn-styled
//   <a> is rendered inside the cell. Use this when you want a compact action link
//   rather than a full-cell highlight (e.g. resource links).
type InfoCardFieldProps = {
  label?: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
  href?: string;
  variant?: "link" | "button";
  target?: string;
  rel?: string;
  className?: string;
};

export function InfoCardField({
  label,
  children,
  icon,
  href,
  variant = "link",
  target,
  rel,
  className,
}: InfoCardFieldProps) {
  const cellBase = cn(
    "border-separator flex flex-col gap-4 px-12 py-16 not-first:border-l",
    className
  );

  if (variant === "button") {
    return (
      <div className={cellBase}>
        {label && <div className="text-gray-2">{label}</div>}
        {href ? (
          <a href={href} target={target} rel={rel} className="btn self-start">
            {icon}
            {children}
          </a>
        ) : (
          <span className="btn self-start">
            {icon}
            {children}
          </span>
        )}
      </div>
    );
  }

  // variant="link": whole cell is the link
  const content = (
    <>
      {label && <div className="text-gray-2">{label}</div>}
      <div className={cn(icon && "flex items-center gap-8")}>
        {icon}
        {children}
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={cn(
          cellBase,
          "hover:bg-panel-highlight-1 cursor-pointer transition-colors"
        )}
      >
        {content}
      </a>
    );
  }

  return <div className={cellBase}>{content}</div>;
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

// LinksField: a single cell containing multiple button-style links.
// No dividers between the buttons — just a tight gap.
// layout="horizontal" (default): buttons wrap in a row.
// layout="vertical": buttons stack in a column.
type LinkItem = {
  label: string;
  href: string;
  icon?: ReactNode;
};

type LinksFieldProps = {
  label?: ReactNode;
  links: LinkItem[];
  layout?: "horizontal" | "vertical";
  target?: string;
  rel?: string;
  className?: string;
};

export function LinksField({
  label,
  links,
  layout = "horizontal",
  target,
  rel,
  className,
}: LinksFieldProps) {
  return (
    <div
      className={cn(
        "border-separator flex flex-col gap-4 px-12 py-16 not-first:border-l",
        className
      )}
    >
      {label && <div className="text-gray-2">{label}</div>}
      <div
        className={cn(
          "flex gap-8",
          layout === "horizontal" ? "flex-wrap" : "flex-col items-start"
        )}
      >
        {links.map((link) => (
          <a
            key={link.href + link.label}
            href={link.href}
            target={target}
            rel={rel}
            className="btn"
          >
            {link.icon}
            {link.label}
          </a>
        ))}
      </div>
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
