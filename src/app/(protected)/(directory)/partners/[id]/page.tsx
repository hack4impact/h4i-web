import { notFound } from "next/navigation";
import { partners } from "@/lib/data";
import { auth } from "@/lib/authn";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, BadgeColor } from "@/components/ui/Badge";
import { DataCard } from "@/components/ui/DataCard";
import { ArrowLeft } from "lucide-react";

const statusColors: Record<string, BadgeColor> = {
  Active: "green",
  Inactive: "grey",
  Hiatus: "orange",
};

type DetailField = {
  label: string;
  key: string;
  type: "text" | "email" | "link";
};

const detailFields: DetailField[] = [
  { label: "Organization Type", key: "Organization Type", type: "text" },
  { label: "Population", key: "Population", type: "text" },
  { label: "Email", key: "Email", type: "email" },
  { label: "Contact Name", key: "Contact Name", type: "text" },
];

export default async function PartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const partner = partners.find((c) => c.id === id);
  if (!partner) notFound();
  console.log(partner);

  const session = await auth();
  const role = session?.user?.role;
  const canEdit = role === "ADMIN" || role === "CHAPTER_LEADER";

  const presentFields = detailFields.filter(
    (f) => partner[f.key] && partner[f.key].trim() !== ""
  );

  const subtitle = [partner["Organization Type"], partner.Population]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="pt-32">
      <div className="mb-8 px-32">
        <a
          href="/partners"
          className="text-gray-2 hover:text-gray-1 flex flex-row items-center gap-4"
        >
          <ArrowLeft width={15} />
          Partners
        </a>
      </div>

      <PageHeader title={partner.Name} subtitle={subtitle}>
        <Badge
          label={partner.Status}
          color={statusColors[partner.Status] ?? "grey"}
        />
        {canEdit && (
          <a href={`/partners/${id}/edit`} className="btn btn-ghost">
            Edit
          </a>
        )}
      </PageHeader>

      <div className="flex gap-12 px-32 py-12">
        <DataCard label="Active Volunteers" value={24} className="flex-1" />
        <DataCard label="Active Projects" value={3} className="flex-1" />
        <DataCard label="Active Partners" value={7} className="flex-1" />
      </div>

      {presentFields.length > 0 && (
        <div className="px-32 py-12">
          <dl className="flex flex-col gap-16">
            {presentFields.map((field) => {
              const value = partner[field.key];
              return (
                <div key={field.key}>
                  <dt className="text-gray-2 mb-4">{field.label}</dt>
                  <dd>
                    {field.type === "email" ? (
                      <a href={`mailto:${value}`} className="hover:underline">
                        {value}
                      </a>
                    ) : field.type === "link" ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}
    </div>
  );
}
