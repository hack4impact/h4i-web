import { notionApi } from "@/lib/notion";
import Link from "next/link";
import { ArrowRight, FolderOpen, Users } from "lucide-react";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="border-separator bg-panel flex flex-col gap-1 rounded-xl border p-5">
      <p className="label text-gray-3">{label}</p>
      <p className="text-inverse font-sans text-4xl font-light tracking-tight">
        {value}
      </p>
      {sub && <p className="label-xs text-gray-4">{sub}</p>}
    </div>
  );
}

export async function ChapterLeaderDashboard({
  userName,
  chapterId,
}: {
  userName?: string | null;
  chapterId?: string | null;
}) {
  const [volunteers, projects, chapters] = await Promise.all([
    notionApi.getVolunteers(),
    notionApi.getProjects(),
    notionApi.getChapters(),
  ]);

  const chapter = chapterId ? chapters.find((c) => c.id === chapterId) : null;
  const chapterUniversity = chapter?.university ?? "";
  const firstName = userName?.split(" ")[0] ?? "there";

  const chapterVolunteers = volunteers.filter(
    (v) => v.chapter === chapterUniversity
  );
  const activeMembers = chapterVolunteers.filter(
    (v) => v.status === "Active"
  ).length;

  const chapterProjects = projects.filter((p) =>
    p.chapter.includes(chapterUniversity)
  );
  const activeProjects = chapterProjects.filter(
    (p) => p.status === "In Progress"
  ).length;

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <header className="border-separator border-b px-8 py-6">
        {chapter && (
          <p className="label text-gray-3 mb-0.5">{chapter.university}</p>
        )}
        <h1 className="text-inverse font-serif text-[28px] leading-snug font-light tracking-tight">
          Good morning, {firstName}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="Active Members"
            value={activeMembers}
            sub={`${chapterVolunteers.length} total`}
          />
          <StatCard
            label="Projects"
            value={chapterProjects.length}
            sub={activeProjects > 0 ? `${activeProjects} active` : undefined}
          />
          <StatCard label="Status" value={chapter?.status ?? "—"} />
        </div>

        {chapter && (
          <div className="mt-8">
            <h2 className="label text-gray-2 mb-3">Chapter Info</h2>
            <div className="border-separator bg-panel rounded-xl border p-5">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
                {chapter.location && (
                  <div>
                    <p className="label-xs text-gray-3 mb-0.5">Location</p>
                    <p className="label text-inverse">{chapter.location}</p>
                  </div>
                )}
                {chapter.founded && (
                  <div>
                    <p className="label-xs text-gray-3 mb-0.5">Founded</p>
                    <p className="label text-inverse">{chapter.founded}</p>
                  </div>
                )}
                <div>
                  <p className="label-xs text-gray-3 mb-0.5">Status</p>
                  <p className="label text-inverse">{chapter.status}</p>
                </div>
                {chapter.memberCount !== undefined && (
                  <div>
                    <p className="label-xs text-gray-3 mb-0.5">
                      All-time Members
                    </p>
                    <p className="label text-inverse">{chapter.memberCount}</p>
                  </div>
                )}
                {chapter.projectCount !== undefined && (
                  <div>
                    <p className="label-xs text-gray-3 mb-0.5">
                      All-time Projects
                    </p>
                    <p className="label text-inverse">{chapter.projectCount}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="label text-gray-2 mb-3">Quick Access</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link
              href="/volunteers"
              className="border-separator bg-panel hover:border-gray-3 group flex items-center gap-4 rounded-xl border p-4 transition-colors"
            >
              <div className="bg-panel-highlight-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <Users size={16} strokeWidth={1.5} className="text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="label text-inverse">Chapter Members</p>
                <p className="label-xs text-gray-3">
                  {activeMembers} active · {chapterVolunteers.length} total
                </p>
              </div>
              <ArrowRight
                size={14}
                strokeWidth={1.5}
                className="text-gray-4 group-hover:text-gray-2 shrink-0 transition-colors"
              />
            </Link>
            <Link
              href="/projects"
              className="border-separator bg-panel hover:border-gray-3 group flex items-center gap-4 rounded-xl border p-4 transition-colors"
            >
              <div className="bg-panel-highlight-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <FolderOpen
                  size={16}
                  strokeWidth={1.5}
                  className="text-blue-500"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="label text-inverse">Chapter Projects</p>
                <p className="label-xs text-gray-3">
                  {chapterProjects.length} total
                  {activeProjects > 0 ? ` · ${activeProjects} active` : ""}
                </p>
              </div>
              <ArrowRight
                size={14}
                strokeWidth={1.5}
                className="text-gray-4 group-hover:text-gray-2 shrink-0 transition-colors"
              />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
