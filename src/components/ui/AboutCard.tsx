import { Card, CardDivider } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AboutCardProps = {
  name: string;
  image?: string;
  bio?: string;
  // Pass detail content to render a right panel separated by a vertical divider.
  // Pass undefined/null to suppress the divider entirely.
  detail?: ReactNode;
  className?: string;
};

export function AboutCard({
  name,
  image,
  bio = "A member of our civic technology community, contributing to projects and initiatives that connect local organizations with technology-driven solutions.",
  detail,
  className,
}: AboutCardProps) {
  return (
    <Card className={cn("flex grow gap-16 py-0", className)}>
      <div className="flex flex-1 flex-row gap-20 py-24">
        <Avatar name={name} image={image} size="lg" />
        <div className="flex flex-col gap-8">
          <span className="text-gray-2">About</span>
          <p className="text-gray-1 leading-relaxed">{bio}</p>
        </div>
      </div>
      {detail != null && (
        <>
          <CardDivider
            className="border-separator border-r"
            orientation="vertical"
          />
          {detail}
        </>
      )}
    </Card>
  );
}
