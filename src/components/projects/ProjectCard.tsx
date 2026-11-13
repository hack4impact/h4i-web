"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { stageLabels } from "@/lib/projects/filters";
import type { ProjectResponse } from "@/lib/projects/types";

const stageColors: Record<ProjectResponse["stage"], BadgeColor> = {
  design: "purple",
  development: "blue",
  launched: "green",
  maintenance: "orange",
};

function Thumbnail({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="bg-panel border-separator flex aspect-[16/9] items-center justify-center overflow-hidden border-b">
      {src && !failed ? (
        // Uploaded/external image hosts are not restricted to a Next Image allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="text-gray-3 flex flex-col items-center gap-8">
          <FolderOpen size={32} strokeWidth={1} aria-hidden="true" />
          <span>No preview available</span>
        </div>
      )}
    </div>
  );
}

export function ProjectCard({
  project,
  chapter,
}: {
  project: ProjectResponse;
  chapter: string;
}) {
  const thumbnail =
    project.demoMedia.find((url) =>
      /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(url)
    ) ||
    project.nonprofitPartnerPhoto ||
    undefined;
  const year = project.startDate
    ? new Date(project.startDate).getUTCFullYear()
    : null;
  return (
    <Link
      href={`/projects/${encodeURIComponent(project.id)}`}
      className="border-separator bg-root hover:border-blue-3 focus-visible:outline-focus rounded-6 flex min-w-0 flex-col overflow-hidden border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <Thumbnail key={thumbnail} src={thumbnail} />
      <div className="flex flex-1 flex-col gap-12 p-16">
        <div>
          <Badge
            label={stageLabels[project.stage]}
            color={stageColors[project.stage]}
          />
          <h2 className="leading-xl mt-8 text-xl break-words">
            {project.name || "Untitled project"}
          </h2>
          <p className="text-gray-2 mt-4">
            {chapter} · {year || "Year not set"}
          </p>
        </div>
        <p className="text-gray-2 line-clamp-2">
          {project.tagline || "No description available yet."}
        </p>
        <p className="text-gray-2 break-words">
          {project.nonprofitPartnerName || "Partner not listed"}
        </p>
        <div
          className="mt-auto flex flex-wrap gap-4"
          aria-label="Technology and impact areas"
        >
          {project.techStack.map((tag) => (
            <Badge key={`tech-${tag}`} label={tag} color="grey" />
          ))}
          {project.causeAreas.map((tag) => (
            <Badge key={`cause-${tag}`} label={tag} color="green" />
          ))}
          {!project.techStack.length && !project.causeAreas.length && (
            <span className="text-gray-3">No tags yet</span>
          )}
        </div>
      </div>
    </Link>
  );
}
