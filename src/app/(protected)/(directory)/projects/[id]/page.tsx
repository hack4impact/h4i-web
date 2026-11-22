import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { ProjectApiError } from "@/lib/projects/http";
import { readProject } from "@/lib/projects/service";
import { canProjectAction } from "@/lib/projects/permissions";
import { db } from "@/lib/db";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireSession();
  const { id } = await params;
  let project;
  try {
    project = await readProject(user, id);
  } catch (error) {
    if (error instanceof ProjectApiError && error.status === 404) notFound();
    throw error;
  }
  const chapter = await db.chapter.findUnique({
    where: { id: project.chapterId },
    select: { name: true },
  });
  return (
    <div className="h-full space-y-20 overflow-y-auto p-32">
      <Link href="/projects" className="underline">
        ← Back to projects
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-16">
        <div>
          <h1>{project.name || "Untitled project"}</h1>
          <p className="text-gray-3 mt-8">
            {chapter?.name} · {project.stage} ·{" "}
            {project.isDraft ? "Draft" : "Published"}
          </p>
        </div>
        {canProjectAction(user, "edit", project.chapterId) && (
          <Link
            href={`/projects/${encodeURIComponent(id)}/edit`}
            className="btn btn-high-contrast"
          >
            Edit
          </Link>
        )}
      </header>
      {project.tagline && <p className="text-xl">{project.tagline}</p>}
      {project.problemStatement && (
        <section className="space-y-8">
          <h2 className="text-xl">Project Goal</h2>
          <p className="whitespace-pre-wrap">{project.problemStatement}</p>
          <p className="whitespace-pre-wrap">{project.goalStatement}</p>
        </section>
      )}
      {project.solutionDescription && (
        <section className="space-y-8">
          <h2 className="text-xl">Solution</h2>
          <p className="whitespace-pre-wrap">{project.solutionDescription}</p>
        </section>
      )}
    </div>
  );
}
