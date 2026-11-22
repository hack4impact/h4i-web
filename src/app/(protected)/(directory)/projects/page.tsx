import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import { requireSession } from "@/lib/auth/guards";
import { canProjectAction } from "@/lib/projects/permissions";
import { listProjects } from "@/lib/projects/service";
import { db } from "@/lib/db";
import { getProjects } from "@/actions/projects";
import { ProjectsTable } from "./ProjectsTable";

export default async function ProjectsPage() {
  const { user } = await requireSession();
  const [{ rows }, records, chapters] = await Promise.all([
    getProjects(),
    listProjects(user, true),
    db.chapter.findMany({ select: { id: true, name: true } }),
  ]);

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
        <section className="mb-24 space-y-12" aria-label="Project records">
          <h2 className="text-xl">Project records</h2>
          {records.length ? (
            <ul className="border-separator divide-separator rounded-6 divide-y border">
              {records.map((project) => (
                <li
                  key={project.id}
                  className="flex flex-wrap items-center justify-between gap-12 p-12"
                >
                  <div>
                    <Link
                      href={`/projects/${encodeURIComponent(project.id)}`}
                      className="underline"
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
                      {project.isDraft ? "Draft" : "Published"}
                    </p>
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
            <p className="text-gray-3">No saved projects yet.</p>
          )}
        </section>
        <h2 className="mb-12 text-xl">Notion project directory</h2>
        <ProjectsTable data={rows} />
      </div>
    </div>
  );
}
