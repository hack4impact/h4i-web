import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getVolunteers } from "@/actions/volunteers";
import type { Volunteer } from "@/data/volunteers";

const columns: Column<Volunteer>[] = [
  { key: "name", label: "Name" },
  { key: "chapter", label: "Chapter" },
  { key: "role", label: "Current Role" },
  { key: "projects", label: "Projects" },
  { key: "joined", label: "Joined", render: (row) => row.joined || "—" },
  {
    key: "status",
    label: "Status",
    render: (row) => <StatusBadge status={row.status} />,
  },
];

export default async function VolunteersPage() {
  const volunteers = await getVolunteers();

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Volunteers Directory">
        <Button>+ Add Volunteer</Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1 px-4 pb-4">
        <DataTable columns={columns} data={volunteers} rowKey="id" />
      </div>
    </div>
  );
}
