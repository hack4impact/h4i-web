import { PageHeader } from "@/components/ui/PageHeader";
import { ProjectsDashboard } from "@/components/projects/ProjectsDashboard";

export default function ProjectsPage() {
  return (
    <div className="h-full overflow-y-auto pt-24">
      <PageHeader
        title="Project Directory"
        subtitle="Explore what chapters are building and the communities they support."
      />
      <div className="mt-20">
        <ProjectsDashboard />
      </div>
    </div>
  );
}
