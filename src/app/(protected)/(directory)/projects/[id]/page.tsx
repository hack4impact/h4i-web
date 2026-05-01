import { notFound } from "next/navigation";
import { chapters, partners, projects } from "@/lib/data";
import { auth } from "@/lib/authn";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, BadgeColor } from "@/components/ui/Badge";
import { DataCard } from "@/components/ui/DataCard";
import { ArrowLeft } from "lucide-react";
import { PartnersTable } from "../../partners/PartnersTable";
import { ChaptersTable } from "../../chapters/ChaptersTable";

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

  const subtitle = [project["Organization Type"], project.Population]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="flex h-full flex-col overflow-y-auto pt-32">
      <div className="mb-8 px-32">
        <a
          href="/projects"
          className="text-gray-2 hover:text-gray-1 flex flex-row items-center gap-4"
        >
          <ArrowLeft width={15} />
          Projects
        </a>
      </div>
      <PageHeader title={project.Name} subtitle={subtitle}>
        <Badge
          label={project.Status}
          color={statusColors[project.Status] ?? "grey"}
        />
        {canEdit && (
          <a href={`/project/${id}/edit`} className="btn btn-ghost">
            Edit
          </a>
        )}
      </PageHeader>
      <div className="flex gap-12 px-32 py-12">
        <DataCard label="Active Volunteers" value={24} className="flex-1" />
        <DataCard label="Active Projects" value={3} className="flex-1" />
        <DataCard label="Active project" value={7} className="flex-1" />
      </div>
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
      <div className="flex min-h-0 flex-1 flex-col gap-12 px-32">
        <div className="">
          <PartnersTable data={projectPartners} />
        </div>
        <div className="">
          <ChaptersTable data={projectChapters} />
        </div>
      </div>
    </div>
  );
}
