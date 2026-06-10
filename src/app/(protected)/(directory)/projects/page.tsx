import { notionApi } from "@/lib/notion";
import { ProjectsTable } from "@/components/ui/projects/ProjectsTable";

export default async function ProjectsPage() {
  const projects = await notionApi.getProjects();

  return (
    <main className="flex flex-1 flex-col">
      <header className="border-separator border-b px-8 py-6">
        <h1 className="text-inverse font-serif text-[28px] leading-snug font-light tracking-tight">
          Projects
        </h1>
        <p className="label text-gray-3 mt-1">{projects.length} total</p>
      </header>
      <div className="p-8">
        <ProjectsTable projects={projects} />
      </div>
    </main>
  );
}
