import { notFound } from "next/navigation";
import { chapters, projects, volunteers } from "@/lib/data";
import { ensureUrl } from "@/lib/utils";
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
  { label: "Organization Email", key: "Organization Email", type: "email" },
  { label: "Personal Email", key: "Personal Email", type: "email" },
  { label: "School Email", key: "School Email", type: "email" },
];

export default async function VolunteerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const volunteer = volunteers.find((c) => c.id === id);
  if (!volunteer) notFound();

  const volunteerProjects = projects.filter((p) =>
    p.Volunteers ? p.Volunteers.includes(volunteer.id) : false
  );

  const volunteerChapters = chapters.filter((c) =>
    volunteer.Chapters ? volunteer.Chapters.includes(c.id) : false
  );

  const session = await auth();
  const role = session?.user?.role;
  const canEdit = role === "ADMIN" || role === "CHAPTER_LEADER";

  const presentFields = detailFields.filter(
    (f) => volunteer[f.key] && volunteer[f.key].trim() !== ""
  );

  const subtitle = [volunteerChapters[0]?.Name, volunteer["Roles"]]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="h-full overflow-y-auto pt-32">
      <div className="mb-8 px-32">
        <a
          href="/volunteers"
          className="text-gray-2 hover:text-gray-1 flex flex-row items-center gap-4"
        >
          <ArrowLeft width={15} strokeWidth={1.5} />
          Volunteers
        </a>
      </div>
      <PageHeader title={volunteer.Name} subtitle={subtitle}>
        <Badge
          label={volunteer.Status}
          color={statusColors[volunteer.Status] ?? "grey"}
        />
        {canEdit && (
          <a href={`/volunteers/${id}/edit`} className="btn btn-ghost">
            Edit
          </a>
        )}
      </PageHeader>

      <div className="px-32">
        <AboutCard
          name={volunteer.Name}
          bio="Passionate about civic engagement and technology-driven community service. Contributes to chapter initiatives and projects that connect volunteers with local organizations, helping build scalable tools for nonprofit teams."
          detail={
            presentFields.length > 0 ? (
              <dl className="flex flex-col gap-16 py-24">
                {presentFields.map((field) => {
                  const value = volunteer[field.key];
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
            ) : undefined
          }
        />
      </div>

      <div className="px-32 py-12">
        <ProjectsTable data={volunteerProjects} />
      </div>
    </div>
  );
}
