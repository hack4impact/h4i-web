export type BadgeColor =
  | "blue"
  | "purple"
  | "pink"
  | "orange"
  | "green"
  | "grey";

export function Badge({ label, color }: { label: string; color: BadgeColor }) {
  return <span className="inline-flex h-4 items-center px-[6px]">{label}</span>;
}
