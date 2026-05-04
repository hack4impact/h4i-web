import { notFound } from "next/navigation";
import { chapters, partners, projects } from "@/lib/data";
import { ensureUrl } from "@/lib/utils";
import { auth } from "@/lib/authn";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, BadgeColor } from "@/components/ui/Badge";
import { ArrowLeft } from "lucide-react";
import { SquareArrowOutUpRight } from "lucide-react";
import { InfoCard, InfoCardRow, InfoCardField } from "@/components/ui/InfoCard";
import { PartnersTable } from "../../partners/PartnersTable";
import { ChaptersTable } from "../../chapters/ChaptersTable";

const statusColors: Record<string, BadgeColor> = {
  Active: "green",
  Inactive: "grey",
  Hiatus: "orange",
  Done: "grey",
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

const resourceLinks: DetailField[] = [
  { label: "GitHub", key: "Github", type: "link" },
];

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = projects.find((c) => c.id === id);
  if (!project) notFound();

  const projectPartners = partners.filter((p) =>
    p.Projects ? p.Projects.includes(project.id) : false
  );

  const projectChapters = chapters.filter((c) =>
    project.Chapters ? project.Chapters.includes(c.id) : false
  );

  const session = await auth();
  const role = session?.user?.role;
  const canEdit = role === "ADMIN" || role === "CHAPTER_LEADER";

  const presentFields = detailFields.filter(
    (f) => project[f.key] && project[f.key].trim() !== ""
  );

  const presentResources = resourceLinks.filter(
    (f) => project[f.key] && project[f.key].trim() !== ""
  );

  const subtitle = [project["Organization Type"], project.Population]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="h-full overflow-y-auto pt-32">
      <div className="mb-8 px-32">
        <a
          href="/projects"
          className="text-gray-2 hover:text-gray-1 flex flex-row items-center gap-4"
        >
          <ArrowLeft width={15} strokeWidth={1.5} />
          Projects
        </a>
      </div>
      <PageHeader title={project.Name} subtitle={subtitle}>
        <Badge
          label={project.Status}
          color={statusColors[project.Status] ?? "grey"}
        />
        {canEdit && (
          <a href={`/projects/${id}/edit`} className="btn btn-ghost">
            Edit
          </a>
        )}
      </PageHeader>

      {presentFields.length > 0 && (
        <div className="px-32 py-12">
          <dl className="flex flex-col gap-16">
            {presentFields.map((field) => {
              const value = project[field.key];
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
                        href={ensureUrl(value)}
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

      {presentResources.length > 0 && (
        <div className="px-32 py-12">
          <InfoCard>
            <InfoCardRow layout="auto">
              {presentResources.map((field) => (
                <InfoCardField
                  key={field.key}
                  href={ensureUrl(project[field.key])}
                  icon={<SquareArrowOutUpRight size={14} strokeWidth={1.5} />}
                  variant="button"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {field.label}
                </InfoCardField>
              ))}
            </InfoCardRow>
          </InfoCard>
        </div>
      )}

      <div className="flex flex-col gap-12 px-32 py-12">
        <div>
          <PartnersTable data={projectPartners} />
        </div>
        <div>
          <ChaptersTable data={projectChapters} />
        </div>
      </div>
    </div>
  );
}
