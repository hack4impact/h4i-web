import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { EDITOR_ROLES } from "@/lib/auth/roles";
import { listDraftProjects } from "@/lib/projects/service";
import { db } from "@/lib/db";

export default async function DraftsPage() {
  const { user } = await requireRole(EDITOR_ROLES);
  const [drafts, chapters] = await Promise.all([
    listDraftProjects(user),
    db.chapter.findMany({ select: { id: true, name: true } }),
  ]);
  return (
    <div className="h-full space-y-20 overflow-y-auto p-32">
      <Link href="/projects" className="underline">
        ← Back to published projects
      </Link>
      <h1>Project drafts</h1>
      <p className="text-gray-3">
        Unpublished work available to you. Drafts are never shown on the project
        dashboard.
      </p>
      {drafts.length ? (
        <ul className="border-separator divide-separator rounded-6 divide-y border">
          {drafts.map((project) => (
            <li
              key={project.id}
              className="flex flex-wrap items-center justify-between gap-12 p-16"
            >
              <div>
                <h2 className="text-lg">
                  {project.name || "Untitled project"}
                </h2>
                <p className="text-gray-3 mt-4">
                  {
                    chapters.find((chapter) => chapter.id === project.chapterId)
                      ?.name
                  }{" "}
                  · {project.stage}
                </p>
              </div>
              <Link
                className="btn"
                href={`/projects/${encodeURIComponent(project.id)}/edit`}
              >
                Resume draft
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No drafts are available.</p>
      )}
    </div>
  );
}
