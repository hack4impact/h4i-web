import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { projects } from "@/lib/data";
import { ProjectsTable } from "./ProjectsTable";

export default function ProjectsPage() {
  return (
    <div className="flex h-full flex-col pt-32">
      <PageHeader title="Projects Directory">
        <Button variant="high-contrast" className="h-full">
          + Add Project
        </Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1 p-32">
        <ProjectsTable data={projects} />
      </div>
    </div>
  );
}
