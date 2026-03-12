"use client";

import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
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

export function ProjectsTable({ data }: { data: Project[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      rowKey="id"
      noun="project"
      filterFields={[
        { key: "status", label: "Status" },
        { key: "type", label: "Type" },
      ]}
    />
  );
}
