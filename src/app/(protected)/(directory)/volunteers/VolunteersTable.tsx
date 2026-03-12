"use client";

import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
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

export function VolunteersTable({ data }: { data: Volunteer[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      rowKey="id"
      noun="volunteer"
      filterFields={[
        { key: "status", label: "Status" },
        { key: "role", label: "Role" },
      ]}
    />
  );
}
