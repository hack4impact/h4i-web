import type { CauseArea } from "@prisma/client";
import {
  Briefcase,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Leaf,
  Palette,
  Shapes,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import type { BadgeColor } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const causeStyles: Record<CauseArea, { color: BadgeColor; icon: LucideIcon }> =
  {
    HEALTH: { color: "pink", icon: HeartPulse },
    EDUCATION: { color: "blue", icon: GraduationCap },
    FOOD_SECURITY: { color: "orange", icon: Wheat },
    HOUSING: { color: "purple", icon: House },
    ENVIRONMENT: { color: "green", icon: Leaf },
    ECONOMIC_OPPORTUNITY: { color: "blue", icon: Briefcase },
    ARTS_AND_CULTURE: { color: "pink", icon: Palette },
    CIVIC_ENGAGEMENT: { color: "purple", icon: Landmark },
    OTHER: { color: "grey", icon: Shapes },
  };

// Stands in for the image in the designs; listings don't have images.
export function CauseBanner({
  causeArea,
  className,
}: {
  causeArea: CauseArea;
  className?: string;
}) {
  const { color, icon: Icon } = causeStyles[causeArea];
  return (
    <div
      aria-hidden
      className={cn("flex items-center justify-center", className)}
      style={{
        backgroundColor: `var(--badge-${color}-bg)`,
        color: `var(--badge-${color}-fg)`,
      }}
    >
      <Icon size={28} strokeWidth={1.25} />
    </div>
  );
}
