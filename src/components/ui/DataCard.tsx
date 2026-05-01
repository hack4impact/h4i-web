import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type DataCardProps = {
  label: string;
  value: number | string;
  className?: string;
};

export function DataCard({ label, value, className }: DataCardProps) {
  return (
    <Card className={cn("p-16", className)}>
      <div className="text-gray-2 mt-4">{label}</div>
      <div className="text-2xl">{value}</div>
    </Card>
  );
}
