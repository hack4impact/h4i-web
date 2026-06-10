import Link from "next/link";
import type { Project } from "@/lib/types/project";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const meta = [project.chapter, project.year].filter(Boolean).join(" · ");
  const teamCount = project.team.length;

  return (
    <Link
      href={`/work/projects/${project.slug}`}
      className="group border-separator bg-panel hover:border-gray-4 flex h-full flex-col overflow-hidden rounded-xl border p-3.5 transition-colors"
    >
      {meta && (
        <p className="text-gray-3 mb-1.5 font-mono text-[9px] tracking-[0.08em] uppercase">
          {meta}
        </p>
      )}
      <p className="text-inverse flex-1 font-sans text-sm leading-snug font-medium">
        {project.title}
      </p>
      <div className="mt-3 flex items-center justify-between">
        {teamCount > 0 ? (
          <p className="text-gray-3 font-mono text-[9px] tracking-[0.06em] uppercase">
            Built by {teamCount} {teamCount === 1 ? "student" : "students"}
          </p>
        ) : null}
        <span className="font-mono text-[9px] tracking-[0.06em] text-blue-500 uppercase transition-colors group-hover:text-blue-600">
          View →
        </span>
      </div>
    </Link>
  );
}
