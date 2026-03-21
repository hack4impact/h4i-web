import type { ReactNode } from "react";

type PageHeaderProps = {
  className?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-8 pt-8">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
