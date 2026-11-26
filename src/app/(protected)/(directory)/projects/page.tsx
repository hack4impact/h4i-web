import { notFound } from "next/navigation";
import { projectListQuery } from "@/lib/projects/sort";
import { ProjectListControls } from "@/components/projects/ProjectListControls";
import { DetailImage } from "@/components/projects/DetailMedia";
import { projectThumbnail } from "@/lib/projects/urls";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import { requireSession } from "@/lib/auth/guards";
import { canProjectAction } from "@/lib/projects/permissions";
import { listProjects } from "@/lib/projects/service";
import { db } from "@/lib/db";
import { getProjects } from "@/actions/projects";
import { ProjectsTable } from "./ProjectsTable";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireSession();
  const parsed = projectListQuery.safeParse(await searchParams);
  const query = parsed.success
    ? parsed.data
    : { sort: "last_updated" as const, chapter_id: undefined };
  const [{ rows }, records, chapters] = await Promise.all([
    getProjects(),
    listProjects(user, false, {
      sort: query.sort,
      chapterId: query.chapter_id,
    }),
    db.chapter.findMany({ select: { id: true, name: true } }),
  ]);

  if (
    query.chapter_id &&
    !chapters.some((chapter) => chapter.id === query.chapter_id)
  )
    notFound();
  return (
    <div className="flex h-full flex-col pt-32">
      <PageHeader title="Projects Directory">
        {canProjectAction(user, "create", user.chapterId ?? undefined) && (
          <Link href="/projects/new" className="btn btn-high-contrast h-full">
            + Add Project
          </Link>
        )}
      </PageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto p-32">
        {canProjectAction(user, "create", user.chapterId ?? undefined) && (
          <Link
            href="/projects/drafts"
            className="mb-16 inline-block underline"
          >
            Resume a draft
          </Link>
        )}
        <ProjectListControls
          sort={query.sort}
          chapterId={query.chapter_id}
          chapters={chapters}
        />
        {!parsed.success && (
          <p role="alert" className="text-red mb-12">
            Those filters are not valid. Showing all published projects.
          </p>
        )}
        <section className="mb-24 space-y-12" aria-label="Project records">
          <h2 className="text-xl">Project records</h2>
          <p className="text-gray-3" role="status">
            Results: {records.length}
            {records.length === 100 ? " (first 100)" : ""}
          </p>
          {records.length ? (
            <ul className="border-separator divide-separator rounded-6 divide-y border">
              {records.map((project) => (
                <li
                  key={project.id}
                  className="flex flex-wrap items-center justify-between gap-12 p-12"
                >
                  <div className="flex min-w-0 items-center gap-12">
                    <div className="bg-panel border-separator text-gray-3 rounded-4 flex h-72 w-112 shrink-0 items-center justify-center overflow-hidden border p-4 text-center">
                      {projectThumbnail(
                        project.demoMedia,
                        project.nonprofitPartnerPhoto
                      ) ? (
                        <DetailImage
                          src={projectThumbnail(
                            project.demoMedia,
                            project.nonprofitPartnerPhoto
                          )!}
                          alt=""
                          className="h-full w-full object-cover"
                          fallback="No preview available"
                        />
                      ) : (
                        <span>No preview available</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/projects/${encodeURIComponent(project.id)}`}
                        className="break-words underline"
                      >
                        {project.name || "Untitled project"}
                      </Link>
                      <p className="text-gray-3 mt-4">
                        {
                          chapters.find(
                            (chapter) => chapter.id === project.chapterId
                          )?.name
                        }{" "}
                        · {project.stage} ·{" "}
                        {project.startDate
                          ? new Date(project.startDate).getUTCFullYear()
                          : "Year not set"}
                      </p>
                      <p className="text-gray-3 mt-4">
                        {project.nonprofitPartnerName || "Partner not listed"}
                      </p>
                    </div>
                  </div>
                  {canProjectAction(user, "edit", project.chapterId) && (
                    <Link
                      href={`/projects/${encodeURIComponent(project.id)}/edit`}
                      className="btn"
                    >
                      Edit
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="border-separator rounded-6 border p-24">
              <h3 className="text-lg">
                {query.chapter_id
                  ? "No published projects in this chapter"
                  : "No published projects yet"}
              </h3>
              <p className="text-gray-3 mt-8">
                {query.chapter_id
                  ? "Choose another chapter or view all chapters."
                  : "Projects appear here after they are published."}
              </p>
              {query.chapter_id && (
                <Link href="/projects" className="mt-12 inline-block underline">
                  View all chapters
                </Link>
              )}
            </div>
          )}
        </section>
        <h2 className="mb-12 text-xl">Notion project directory</h2>
        <ProjectsTable data={rows} />
      </div>
    </div>
  );
}
