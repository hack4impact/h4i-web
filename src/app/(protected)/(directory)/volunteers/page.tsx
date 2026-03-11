import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { volunteers, type Volunteer } from "@/data/volunteers";

const columns: Column<Volunteer>[] = [
  { key: "name", label: "Name" },
  { key: "chapter", label: "Chapter" },
  { key: "role", label: "Current Role" },
  { key: "projects", label: "Projects" },
  { key: "joined", label: "Joined" },
  {
    key: "status",
    label: "Status",
    render: (row) => <StatusBadge status={row.status} />,
  },
];

export default function VolunteersPage() {
  return (
    <div>
      <PageHeader title="Volunteers Directory">
        <Button>+ Add Volunteer</Button>
      </PageHeader>
      <div className="px-4 pb-4">
        <div className="border-border bg-card overflow-hidden rounded-md border">
          <DataTable columns={columns} data={volunteers} rowKey="id" />
        </div>
      </div>
    </div>
  );
}
