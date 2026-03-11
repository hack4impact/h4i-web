import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { projects, type Project } from "@/data/projects";

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

export default function ProjectsPage() {
  return (
    <div>
      <PageHeader title="Projects Directory">
        <Button>+ Add Project</Button>
      </PageHeader>
      <div className="px-4 pb-4">
        <div className="border-border bg-card overflow-hidden rounded-md border">
          <DataTable columns={columns} data={projects} rowKey="id" />
        </div>
      </div>
    </div>
  );
}
