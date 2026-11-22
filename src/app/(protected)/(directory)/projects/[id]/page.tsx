import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { ProjectApiError } from "@/lib/projects/http";
import { readProject } from "@/lib/projects/service";
import { canProjectAction } from "@/lib/projects/permissions";
import { selectedMemberReferences } from "@/lib/projects/references";
import { projectUrl } from "@/lib/projects/urls";
import { MemberAvatar } from "@/components/projects/ReferencePickers";
import { DetailImage, DetailMedia } from "@/components/projects/DetailMedia";
import { Badge } from "@/components/ui/Badge";
import { db } from "@/lib/db";

function date(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
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
  const [chapter, members] = await Promise.all([
    db.chapter.findUnique({
      where: { id: project.chapterId },
      select: { name: true },
    }),
    selectedMemberReferences(
      user,
      project.teamMembers.map((member) => member.userId)
    ),
  ]);
  const photo = projectUrl(project.nonprofitPartnerPhoto, true);
  const media = project.demoMedia
    .map((url) => projectUrl(url, true))
    .filter((url): url is string => Boolean(url));
  const links = project.resourceLinks
    .map((link) => ({ ...link, href: projectUrl(link.url) }))
    .filter((link) => link.href);
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-1100 space-y-28 px-16 py-24 sm:px-32">
        <Link href="/projects" className="underline">
          ← Back to projects
        </Link>
        <header className="flex flex-wrap items-start justify-between gap-16">
          <div className="space-y-12">
            <div className="flex flex-wrap gap-6">
              <Badge
                label={project.stage[0].toUpperCase() + project.stage.slice(1)}
                color="blue"
              />
              <Badge label={chapter?.name || "Chapter"} color="grey" />
              {project.startDate && (
                <Badge
                  label={String(new Date(project.startDate).getUTCFullYear())}
                  color="grey"
                />
              )}
              {project.isDraft && (
                <Badge label="Unpublished draft" color="orange" />
              )}
            </div>
            <h1>{project.name || "Untitled project"}</h1>
            {project.tagline && (
              <p className="text-gray-2 text-xl">{project.tagline}</p>
            )}
            <div className="flex flex-wrap gap-6">
              {project.techStack.map((tag) => (
                <Badge key={`tech-${tag}`} label={tag} color="grey" />
              ))}
              {project.causeAreas.map((tag) => (
                <Badge key={`cause-${tag}`} label={tag} color="green" />
              ))}
            </div>
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
        <section
          aria-label="Nonprofit partner and timeline"
          className="border-separator bg-panel rounded-6 flex flex-wrap items-center justify-between gap-20 border p-20"
        >
          <div className="flex items-center gap-12">
            {photo && (
              <DetailImage
                src={photo}
                alt={`${project.nonprofitPartnerName || "Partner"} logo`}
                className="h-64 w-64 object-contain"
              />
            )}
            <div>
              <p className="text-gray-3">Nonprofit partner</p>
              <h2 className="mt-4 text-lg">
                {project.nonprofitPartnerName || "Partner not listed"}
              </h2>
              {project.nonprofitPartnerId && (
                <p className="text-gray-3 mt-4">Linked to Partner Directory</p>
              )}
            </div>
          </div>
          <dl className="space-y-8">
            <div>
              <dt className="text-gray-3">Timeline</dt>
              <dd>
                {project.startDate
                  ? date(project.startDate)
                  : "Start date not set"}{" "}
                – {project.endDate ? date(project.endDate) : "Ongoing"}
              </dd>
            </div>
            {project.lastUpdated && (
              <div>
                <dt className="text-gray-3">Last updated</dt>
                <dd>{date(project.lastUpdated)}</dd>
              </div>
            )}
          </dl>
        </section>
        {(project.problemStatement || project.goalStatement) && (
          <section className="space-y-12">
            <h2 className="text-xl">Project Goal</h2>
            {project.problemStatement && (
              <div>
                <h3 className="mb-8">What problem were we solving?</h3>
                <p className="text-gray-2 break-words whitespace-pre-wrap">
                  {project.problemStatement}
                </p>
              </div>
            )}
            {project.goalStatement && (
              <div>
                <h3 className="mb-8">What was our goal?</h3>
                <p className="text-gray-2 break-words whitespace-pre-wrap">
                  {project.goalStatement}
                </p>
              </div>
            )}
          </section>
        )}
        {project.teamMembers.length > 0 && (
          <section className="space-y-12">
            <h2 className="text-xl">Team</h2>
            <ul className="grid grid-cols-1 gap-16 sm:grid-cols-2">
              {project.teamMembers.map((member) => {
                const person = members.find(
                  (item) => item.id === member.userId
                );
                return (
                  <li
                    key={`${member.userId}-${member.role}`}
                    className="flex items-center gap-12"
                  >
                    <MemberAvatar name={person?.name || "Member"} />
                    <div>
                      <p>{person?.name || "Member"}</p>
                      <p className="text-gray-3">{member.role}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        {project.solutionDescription && (
          <section className="space-y-12">
            <h2 className="text-xl">Solution</h2>
            <p className="text-gray-2 break-words whitespace-pre-wrap">
              {project.solutionDescription}
            </p>
          </section>
        )}
        {media.length > 0 && (
          <section className="space-y-12">
            <h2 className="text-xl">Demo Media</h2>
            <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
              {media.map((src, index) => (
                <DetailMedia key={`${src}-${index}`} src={src} index={index} />
              ))}
            </div>
          </section>
        )}
        {links.length > 0 && (
          <section className="space-y-12">
            <h2 className="text-xl">Resource Links</h2>
            <ul className="space-y-12">
              {links.map((link, index) => (
                <li key={`${link.type}-${index}`}>
                  <a
                    href={link.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-2 break-all underline"
                  >
                    {link.type === "GoogleDrive" ? "Google Drive" : link.type} ↗{" "}
                    <span className="text-gray-3">{link.url}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
