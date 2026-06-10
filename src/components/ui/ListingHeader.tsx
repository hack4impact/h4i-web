import { cn } from "@/lib/utils";
import { GRADIENT_CLASS, TEXT_CLASS } from "@/lib/constants";

interface ListingHeaderProps {
  label: string;
  title: string;
  description: string;
  countLabel: string;
  color?: string;
}

export function ListingHeader({
  label,
  title,
  description,
  countLabel,
  color = "blue",
}: ListingHeaderProps) {
  return (
    <section
      className={cn(
        GRADIENT_CLASS[color] ?? "gradient-bl-blue",
        "border-separator border-b px-8 pt-14 pb-12 md:px-16"
      )}
    >
      <div className="section-inner">
        <div className="flex items-baseline justify-between pb-4">
          <p className={cn("label", TEXT_CLASS[color])}>{label}</p>
          <p className="label text-gray-3">{countLabel}</p>
        </div>
        <h1 className="heading-display pb-4">{title}</h1>
        <p className="text-gray-3 max-w-4xl font-sans text-base leading-6">
          {description}
        </p>
      </div>
    </section>
  );
}
