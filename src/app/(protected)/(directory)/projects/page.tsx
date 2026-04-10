import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getProjects } from "@/actions/projects";
import { ProjectsTable } from "./ProjectsTable";

export default async function ProjectsPage() {
  const { rows } = await getProjects();

  return (
    <div className="flex h-full flex-col pt-32">
      <PageHeader title="Projects Directory">
        <Button variant="high-contrast" className="h-full">
          + Add Project
        </Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1 p-32">
        <ProjectsTable data={rows} />
      </div>
    </div>
  );
}
