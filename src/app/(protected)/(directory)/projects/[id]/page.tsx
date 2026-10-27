import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { getProjectDetail } from "@/lib/projects/detail";
import { chapterLabels } from "@/lib/projects/chapters";
import { stageLabels } from "@/lib/projects/filters";
import { safeExternalUrl, safeMediaUrl } from "@/lib/projects/urls";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { ProjectImage, ProjectMedia } from "@/components/projects/ProjectMedia";

const stageColors: Record<keyof typeof stageLabels, BadgeColor> = {
  design: "purple",
  development: "blue",
  launched: "green",
  maintenance: "orange",
};
function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-separator space-y-16 border-t pt-24">
      <h2 className="text-xl">{title}</h2>
      {children}
    </section>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const { id } = await params;
  const project = await getProjectDetail(id, session.user);
  if (!project) notFound();
  const [chapter] = await chapterLabels([project.chapterId]);
  const partnerPhoto = safeMediaUrl(project.nonprofitPartnerPhoto);
  const media = [...new Set(project.demoMedia)]
    .map(safeMediaUrl)
    .filter((url): url is string => Boolean(url));
  const links = project.resourceLinks
    .map((link) => ({ ...link, href: safeExternalUrl(link.url) }))
    .filter((link) => link.href);
  const hasGoal = Boolean(
    project.problemStatement?.trim() || project.goalStatement?.trim()
  );
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-1100 space-y-32 px-16 py-24 sm:px-32">
        <Link href="/projects" className="text-gray-2 inline-block underline">
          ← Back to Project Directory
        </Link>
        <header className="space-y-16">
          <div className="flex flex-wrap gap-8">
            <Badge
              label={stageLabels[project.stage]}
              color={stageColors[project.stage]}
            />
            <Badge label={chapter.name} color="grey" />
            {project.startDate && (
              <Badge
                label={String(project.startDate.getUTCFullYear())}
                color="grey"
              />
            )}
            {project.isDraft && (
              <Badge label="Draft · Not visible to members" color="orange" />
            )}
          </div>
          <h1 className="break-words">{project.name || "Untitled project"}</h1>
          {project.tagline?.trim() && (
            <p className="text-gray-2 leading-xl text-xl">{project.tagline}</p>
          )}
          {(project.techStack.length > 0 || project.causeAreas.length > 0) && (
            <div
              className="flex flex-wrap gap-6"
              aria-label="Technology and impact areas"
            >
              {project.techStack.map((tag) => (
                <Badge key={`tech-${tag}`} label={tag} color="blue" />
              ))}
              {project.causeAreas.map((tag) => (
                <Badge key={`cause-${tag}`} label={tag} color="green" />
              ))}
            </div>
          )}
        </header>
        <section
          aria-label="Nonprofit partner and timeline"
          className="border-separator bg-panel rounded-6 border p-20"
        >
          <div className="flex flex-wrap items-center justify-between gap-20">
            <div className="flex min-w-0 items-center gap-16">
              {partnerPhoto ? (
                <ProjectImage
                  src={partnerPhoto}
                  alt={`${project.nonprofitPartnerName || "Nonprofit partner"} logo`}
                  className="rounded-6 h-64 w-64 shrink-0 object-contain"
                />
              ) : (
                <span
                  className="bg-root text-gray-3 flex h-48 w-48 shrink-0 items-center justify-center rounded-full text-xl"
                  aria-hidden="true"
                >
                  {(project.nonprofitPartnerName || "?").slice(0, 1)}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-gray-3">Nonprofit partner</p>
                <h2 className="mt-4 text-lg break-words">
                  {project.nonprofitPartnerName || "Partner not listed"}
                </h2>
              </div>
            </div>
            <dl className="flex flex-wrap gap-x-32 gap-y-12">
              <div>
                <dt className="text-gray-3">Timeline</dt>
                <dd className="mt-4">
                  {project.startDate
                    ? formatDate(project.startDate)
                    : "Start date not set"}{" "}
                  – {project.endDate ? formatDate(project.endDate) : "Ongoing"}
                </dd>
              </div>
              {project.lastUpdated && (
                <div>
                  <dt className="text-gray-3">Last updated</dt>
                  <dd className="mt-4">{formatDate(project.lastUpdated)}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>
        {hasGoal && (
          <Section title="Project Goal">
            {project.problemStatement?.trim() && (
              <div>
                <h3 className="mb-8 text-lg">What problem were we solving?</h3>
                <p className="text-gray-2 break-words whitespace-pre-wrap">
                  {project.problemStatement}
                </p>
              </div>
            )}
            {project.goalStatement?.trim() && (
              <div>
                <h3 className="mb-8 text-lg">What was our goal?</h3>
                <p className="text-gray-2 break-words whitespace-pre-wrap">
                  {project.goalStatement}
                </p>
              </div>
            )}
          </Section>
        )}
        {project.teamMembers.length > 0 && (
          <Section title="Team">
            <ul className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
              {project.teamMembers.map((member) => (
                <li key={member.id} className="flex items-center gap-12">
                  <span
                    className="bg-panel text-gray-2 flex h-40 w-40 shrink-0 items-center justify-center rounded-full"
                    aria-hidden="true"
                  >
                    {(member.user.name || "Member")
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((name) => name[0])
                      .join("")}
                  </span>
                  <div className="min-w-0">
                    <p className="break-words">
                      {member.user.name || "Member"}
                    </p>
                    <p className="text-gray-3 break-words">{member.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}
        {project.solutionDescription?.trim() && (
          <Section title="Solution">
            <p className="text-gray-2 break-words whitespace-pre-wrap">
              {project.solutionDescription}
            </p>
          </Section>
        )}
        {media.length > 0 && (
          <Section title="Demo Media">
            <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
              {media.map((src, index) => (
                <ProjectMedia key={src} src={src} index={index} />
              ))}
            </div>
          </Section>
        )}
        {links.length > 0 && (
          <Section title="Resource Links">
            <ul className="space-y-12">
              {links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-2 rounded-4 focus-visible:outline-focus inline-flex max-w-full flex-col gap-4 underline focus-visible:outline-2"
                  >
                    <span>
                      {link.type === "GoogleDrive" ? "Google Drive" : link.type}
                      <span className="sr-only"> (opens in a new tab)</span> ↗
                    </span>
                    <span className="text-gray-3 break-all">{link.url}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </article>
    </div>
  );
}
