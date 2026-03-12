"use client";

import { DataTable, type Column } from "@/components/ui/DataTable";
import type { Partner } from "@/data/partners";

const columns: Column<Partner>[] = [
  { key: "organization", label: "Organization" },
  { key: "type", label: "Type" },
  { key: "projects", label: "Projects", render: (row) => row.projects ?? "—" },
  { key: "chapter", label: "Chapter" },
  { key: "since", label: "Since", render: (row) => row.since || "—" },
];

export function PartnersTable({ data }: { data: Partner[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      rowKey="id"
      noun="partner"
      filterFields={[{ key: "type", label: "Type" }]}
    />
  );
}
