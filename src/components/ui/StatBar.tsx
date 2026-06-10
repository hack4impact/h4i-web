import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatBarItem {
  label: string;
  value: string | number | ReactNode;
}

interface StatBarProps {
  stats: StatBarItem[];
}

export function StatBar({ stats }: StatBarProps) {
  return (
    <section className="px-8 md:px-16">
      <div className="mx-auto flex max-w-[1312px]">
        {stats.map((stat, index) => (
          <div
            key={stat.label || index}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-2 py-7",
              index < stats.length - 1 && "border-separator border-r"
            )}
          >
            {typeof stat.value === "string" ||
            typeof stat.value === "number" ? (
              <span className="heading-stat">{stat.value}</span>
            ) : (
              stat.value
            )}
            {stat.label && (
              <span className="label text-gray-3">{stat.label}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
