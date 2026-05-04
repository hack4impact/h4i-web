import { notFound } from "next/navigation";
import { chapters, partners, projects, volunteers } from "@/lib/data";
import { ensureUrl } from "@/lib/utils";
import { auth } from "@/lib/authn";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, BadgeColor } from "@/components/ui/Badge";
import { DataCard } from "@/components/ui/DataCard";
import { ArrowLeft, SquareArrowOutUpRight } from "lucide-react";
import { ProjectsTable } from "../../projects/ProjectsTable";
import { Card, CardDivider } from "@/components/ui/Card";

const statusColors: Record<string, BadgeColor> = {
  Active: "green",
  Forming: "blue",
  Scoping: "blue",
  Inactive: "grey",
  Hiatus: "orange",
  Main: "purple",
};

type DetailField = {
  label: string;
  key: string;
  type: "text" | "email" | "link";
};

const detailFields: DetailField[] = [
  { label: "Email", key: "Email", type: "email" },
  { label: "Website", key: "Website", type: "link" },
  { label: "LinkedIn", key: "LinkedIn", type: "link" },
  { label: "Instagram", key: "Instagram", type: "link" },
];

const resourceLinks: DetailField[] = [
  { label: "Google Drive", key: "Google Drive", type: "link" },
  { label: "GitHub", key: "GitHub", type: "link" },
  { label: "Notion", key: "Notion", type: "link" },
];

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const chapter = chapters.find((c) => c.id === id);
  if (!chapter) notFound();

  const chapterProjects = projects.filter((p) =>
    p.Chapters ? p.Chapters.includes(chapter.id) : false
  );

  const chapterVolunteers = volunteers.filter((v) =>
    v.Chapters ? v.Chapters.includes(chapter.id) : false
  );

  const chapterPartners = partners.filter((partner) =>
    partner.Chapters ? partner.Chapters.includes(chapter.id) : false
  );

  const session = await auth();
  const role = session?.user?.role;
  const canEdit = role === "ADMIN" || role === "CHAPTER_LEADER";

  const presentFields = detailFields.filter(
    (f) => chapter[f.key] && chapter[f.key].trim() !== ""
  );

  const presentResources = resourceLinks.filter(
    (f) => chapter[f.key] && chapter[f.key].trim() !== ""
  );

  const subtitle = [
    chapter.Place,
    chapter.Founded ? `Founded ${chapter.Founded}` : "",
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="flex h-full flex-col gap-12 overflow-y-auto py-32">
      <div className="mb-8 px-32">
        <a
          href="/chapters"
          className="text-gray-2 hover:text-gray-1 flex flex-row items-center gap-4"
        >
          <ArrowLeft width={15} strokeWidth={1.5} />
          Chapters
        </a>
      </div>

      <PageHeader title={chapter.Name} subtitle={subtitle}>
        <Badge
          label={chapter.Status}
          color={statusColors[chapter.Status] ?? "grey"}
        />
        {canEdit && (
          <a href={`/chapters/${id}/edit`} className="btn btn-ghost">
            Edit
          </a>
        )}
      </PageHeader>

      {presentFields.length > 0 && (
        <div className="px-32">
          <Card className="flex grow gap-16 py-0">
            <div className="flex-1"></div>
            <CardDivider
              className="border-separator flex border-r"
              orientation="vertical"
            ></CardDivider>
            <dl className="flex flex-col gap-16 py-24">
              {presentFields.map((field) => {
                const value = chapter[field.key];
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
          </Card>
        </div>
      )}

      <div className="flex gap-12 px-32">
        <DataCard
          label="All Volunteers"
          value={chapterVolunteers.length}
          className="flex-1"
        />
        <DataCard
          label="All Projects"
          value={chapterProjects.length}
          className="flex-1"
        />
        <DataCard
          label="All Partners"
          value={chapterPartners.length}
          className="flex-1"
        />
      </div>

      {presentResources.length > 0 && (
        <div className="flex px-32">
          <Card className="flex grow flex-row gap-16 py-16">
            {presentResources.map((field) => {
              const value = chapter[field.key];
              return (
                <a
                  key={field.key}
                  className="btn btn-md cursor-pointer"
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SquareArrowOutUpRight size={15} strokeWidth={1.5} />
                  {field.label}
                </a>
              );
            })}
          </Card>
        </div>
      )}

      <div className="h-400 px-32">
        <ProjectsTable data={chapterProjects} />
      </div>
    </div>
  );
}
