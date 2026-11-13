import { PageHeader } from "@/components/ui/PageHeader";
import { ProjectGridLoading } from "@/components/projects/ProjectsDashboard";

export default function Loading() {
  return (
    <div className="h-full overflow-y-auto pt-24">
      <PageHeader title="Project Directory" />
      <div className="p-32">
        <ProjectGridLoading />
      </div>
    </div>
  );
}
