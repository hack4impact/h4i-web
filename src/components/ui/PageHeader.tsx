import type { ReactNode } from "react";

type PageHeaderProps = {
  className?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-32 pt-32">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="mt-2">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-8">{children}</div>}
    </div>
  );
}
