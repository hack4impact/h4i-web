import type { SourcedProjectStatus } from "@prisma/client";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { STATUS_LABELS } from "@/lib/sourced-projects/labels";

const statusColors: Record<SourcedProjectStatus, BadgeColor> = {
  AVAILABLE: "green",
  CLAIM_PENDING: "orange",
  CLAIMED: "blue",
  IN_PROGRESS: "purple",
  COMPLETED: "grey",
  ARCHIVED: "grey",
};

export function StatusBadge({ status }: { status: SourcedProjectStatus }) {
  return <Badge label={STATUS_LABELS[status]} color={statusColors[status]} />;
}
