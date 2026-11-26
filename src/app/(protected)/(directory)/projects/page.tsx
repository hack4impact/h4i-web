import { notFound } from "next/navigation";
import {
  projectListQuery,
  projectListOptions,
  projectsUrl,
} from "@/lib/projects/sort";
import { ProjectListControls } from "@/components/projects/ProjectListControls";
import { DetailImage } from "@/components/projects/DetailMedia";
import { projectThumbnail } from "@/lib/projects/urls";
import Link from "next/link";
import { requireSession } from "@/lib/auth/guards";
import { canProjectAction } from "@/lib/projects/permissions";
import { searchProjects } from "@/lib/projects/service";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireSession();
  const parsed = projectListQuery.safeParse(await searchParams);
  const query = parsed.success ? parsed.data : projectListQuery.parse({});
  const [results, chapters, impactRecords] = await Promise.all([
    searchProjects(user, false, projectListOptions(query)),
    db.chapter.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.project.findMany({
      where: { isDraft: false },
      select: { causeAreas: true },
      distinct: ["causeAreas"],
    }),
  ]);
  const records = results.items;
  const active = Boolean(
    query.q ||
    query.chapter_id ||
    query.stage ||
    query.project_length ||
    query.impact_area
  );

  if (
    query.chapter_id &&
    !chapters.some((chapter) => chapter.id === query.chapter_id)
  )
    notFound();
  return (
    <div className="flex h-full flex-col pt-32">
      <header className="flex flex-wrap items-center justify-between gap-12 px-16 py-12 sm:px-32">
        <h1>Project Directory</h1>
        {canProjectAction(user, "create", user.chapterId ?? undefined) && (
          <Link href="/projects/new" className="btn btn-high-contrast min-h-44">
            + Add Project
          </Link>
        )}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-16 sm:p-32">
        {canProjectAction(user, "create", user.chapterId ?? undefined) && (
          <Link
            href="/projects/drafts"
            className="mb-16 inline-block underline"
          >
            Resume a draft
          </Link>
        )}
        <ProjectListControls
          query={query}
          chapters={chapters}
          impactAreas={[
            ...new Set(impactRecords.flatMap((record) => record.causeAreas)),
          ]}
        />
        {!parsed.success && (
          <p role="alert" className="text-red mb-12">
            Those filters are not valid. Showing all published projects.
          </p>
        )}
        <section className="mb-24 space-y-12" aria-label="Project records">
          <h2 className="text-xl">Project records</h2>
          <p className="text-gray-3" role="status">
            Results: {results.total}
          </p>
          {records.length ? (
            <ul className="grid grid-cols-1 gap-16 md:grid-cols-2 xl:grid-cols-3">
              {records.map((project) => (
                <li
                  key={project.id}
                  className="border-separator bg-panel rounded-6 flex min-w-0 flex-col items-start gap-12 border p-16"
                >
                  <div className="flex w-full min-w-0 flex-col gap-12">
                    <div className="bg-panel border-separator text-gray-3 rounded-4 flex h-144 w-full shrink-0 items-center justify-center overflow-hidden border p-4 text-center">
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
                    <div className="w-full min-w-0">
                      <Link
                        href={`/projects/${encodeURIComponent(project.id)}`}
                        className="text-lg break-words underline"
                      >
                        {project.name || "Untitled project"}
                      </Link>
                      <p className="text-gray-3 mt-4">
                        {
                          chapters.find(
                            (chapter) => chapter.id === project.chapterId
                          )?.name
                        }{" "}
                        ·{" "}
                        {project.startDate
                          ? new Date(project.startDate).getUTCFullYear()
                          : "Year not set"}
                      </p>
                      <p className="text-gray-3 mt-4">
                        {project.nonprofitPartnerName || "Partner not listed"}
                      </p>
                      <div className="mt-8 flex flex-wrap gap-6 [&>span]:h-auto [&>span]:max-w-full [&>span]:break-words">
                        <Badge
                          label={
                            project.stage[0].toUpperCase() +
                            project.stage.slice(1)
                          }
                          color="blue"
                        />
                        {[...project.techStack, ...project.causeAreas].map(
                          (tag, index) => (
                            <Badge
                              key={`${tag}-${index}`}
                              label={tag}
                              color="grey"
                            />
                          )
                        )}
                      </div>
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
                {active
                  ? "No projects match these filters"
                  : "No published projects yet"}
              </h3>
              <p className="text-gray-3 mt-8">
                {active
                  ? "Try another search or remove a filter."
                  : "Projects appear here after they are published."}
              </p>
              {active && (
                <Link href="/projects" className="mt-12 inline-block underline">
                  Clear filters
                </Link>
              )}
            </div>
          )}
        </section>
        {results.total > 0 && (
          <nav
            aria-label="Project pages"
            className="flex flex-wrap items-center justify-between gap-12"
          >
            {results.page > 1 ? (
              <Link
                className="btn min-h-44"
                href={projectsUrl({ ...query, page: results.page - 1 })}
              >
                Previous page
              </Link>
            ) : (
              <span />
            )}
            <p>
              Page {results.page} of {results.pages}
            </p>
            {results.page < results.pages ? (
              <Link
                className="btn min-h-44"
                href={projectsUrl({ ...query, page: results.page + 1 })}
              >
                Next page
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
