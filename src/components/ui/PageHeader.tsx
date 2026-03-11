import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-5 pb-4">
      <div>
        <h1 className="text-text-primary text-lg leading-tight font-semibold">
          {title}
        </h1>
        {subtitle && (
          <p className="text-text-meta text-md mt-0.5">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
