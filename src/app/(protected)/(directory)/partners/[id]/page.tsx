import { notFound } from "next/navigation";
import { partners, projects } from "@/lib/data";
import { auth } from "@/lib/authn";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, BadgeColor } from "@/components/ui/Badge";
import { AboutCard } from "@/components/ui/AboutCard";
import { ArrowLeft } from "lucide-react";
import { ProjectsTable } from "../../projects/ProjectsTable";

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

  const partnerProjects = projects.filter((p) =>
    p.Partners ? p.Partners.includes(partner.id) : false
  );

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
    <div className="h-full overflow-y-auto pt-32">
      <div className="mb-8 px-32">
        <a
          href="/partners"
          className="text-gray-2 hover:text-gray-1 flex flex-row items-center gap-4"
        >
          <ArrowLeft width={15} strokeWidth={1.5} />
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

      <div className="px-32">
        <AboutCard
          name={partner.Name}
          bio="A valued community partner working alongside our chapters to deliver impact. Collaborates on projects that support local communities and advance the organization's civic technology mission."
          detail={
            presentFields.length > 0 ? (
              <dl className="flex flex-col gap-16 py-24">
                {presentFields.map((field) => {
                  const value = partner[field.key];
                  return (
                    <div key={field.key}>
                      <dt className="text-gray-2 mb-4">{field.label}</dt>
                      <dd>
                        {field.type === "email" ? (
                          <a
                            href={`mailto:${value}`}
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
            ) : undefined
          }
        />
      </div>

      <div className="px-32 py-12">
        <ProjectsTable data={partnerProjects} />
      </div>
    </div>
  );
}
