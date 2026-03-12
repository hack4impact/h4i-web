import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getProjects } from "@/actions/projects";
import { ProjectsTable } from "./ProjectsTable";

export default async function ProjectsPage() {
  const { rows } = await getProjects();

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Projects Directory">
        <Button>+ Add Project</Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1 px-4 pb-4">
        <ProjectsTable data={rows} />
      </div>
    </div>
  );
}
