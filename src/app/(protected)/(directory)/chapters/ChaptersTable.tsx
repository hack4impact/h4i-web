"use client";

import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Chapter } from "@/data/chapters";

const columns: Column<Chapter>[] = [
  { key: "name", label: "Chapter" },
  { key: "university", label: "University" },
  { key: "volunteers", label: "Volunteers" },
  { key: "projects", label: "Projects", render: (row) => row.projects ?? "—" },
  {
    key: "coExecDirectors",
    label: "Co-Exec Directors",
    render: (row) => row.coExecDirectors ?? "—",
  },
  {
    key: "status",
    label: "Status",
    render: (row) => <StatusBadge status={row.status} />,
  },
];

export function ChaptersTable({ data }: { data: Chapter[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      rowKey="id"
      noun="chapter"
      filterFields={[{ key: "status", label: "Status" }]}
    />
  );
}
