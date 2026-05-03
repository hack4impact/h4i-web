import { auth } from "@/lib/authn";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@base-ui/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { BadgeColor } from "@/components/ui/Badge";
import type { AppRole } from "@/types";

const roleLabels: Record<AppRole, string> = {
  ADMIN: "Admin",
  CHAPTER_LEADER: "Chapter Leader",
  VOLUNTEER: "Volunteer",
};

const roleBadgeColors: Record<AppRole, BadgeColor> = {
  ADMIN: "purple",
  CHAPTER_LEADER: "blue",
  VOLUNTEER: "green",
};

export default async function SettingsPage() {
  const session = await auth();
  const { name, email, image, role } = session!.user;

  return (
    <div className="flex h-full flex-col pt-32">
      <PageHeader title="Settings" />
      <div className="p-32">
        <Card className="max-w-480 space-y-20">
          <Avatar.Root className="flex items-center gap-16">
            {image ? (
              <Avatar.Image
                src={image}
                alt={name ?? ""}
                className="rounded-6 h-48 w-48"
              />
            ) : (
              <Avatar.Fallback className="bg-blue-3 rounded-6 flex h-48 w-48 shrink-0 items-center justify-center text-lg font-medium text-white">
                {name
                  ? name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "?"}
              </Avatar.Fallback>
            )}
            <div className="min-w-0">
              <p className="text-gray-1 font-medium">{name ?? "—"}</p>
              <p className="text-gray-3 truncate text-sm">{email}</p>
            </div>
          </Avatar.Root>

          <div className="border-separator space-y-16 border-t pt-20">
            <Field label="Email" value={email ?? "—"} />
            <Field
              label="Role"
              value={
                <Badge label={roleLabels[role]} color={roleBadgeColors[role]} />
              }
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-16">
      <span className="text-gray-3 shrink-0">{label}</span>
      <span className="text-gray-1">{value}</span>
    </div>
  );
}
