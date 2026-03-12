"use client";

import { DataTable } from "@/components/ui/DataTable";

type Row = Record<string, string>;

export function ProjectsTable({ data }: { data: Row[] }) {
  return (
    <DataTable
      data={data}
      rowKey="id"
      noun="project"
      filterFields={[
        { key: "Status", label: "Status" },
        { key: "Type", label: "Type" },
      ]}
    />
  );
}
