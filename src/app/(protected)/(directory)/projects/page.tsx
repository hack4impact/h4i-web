import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getProjects } from "@/actions/projects";
import type { Project } from "@/data/projects";

const columns: Column<Project>[] = [
  { key: "name", label: "Project" },
  { key: "chapter", label: "Chapter" },
  { key: "type", label: "Project Type" },
  { key: "volunteers", label: "Vol." },
  { key: "partner", label: "Partner" },
  {
    key: "status",
    label: "Status",
    render: (row) => <StatusBadge status={row.status} />,
  },
];

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Projects Directory">
        <Button>+ Add Project</Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1 px-4 pb-4">
        <div className="border-border bg-card [&::-webkit-scrollbar-thumb]:bg-border flex-1 overflow-auto overscroll-contain rounded-md border [scrollbar-color:var(--color-border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-track]:bg-transparent">
          <DataTable columns={columns} data={projects} rowKey="id" />
        </div>
      </div>
    </div>
  );
}
