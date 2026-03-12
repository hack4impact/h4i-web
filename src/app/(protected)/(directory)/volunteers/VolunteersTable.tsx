"use client";

import { DataTable } from "@/components/ui/DataTable";

type Row = Record<string, string>;

export function VolunteersTable({ data }: { data: Row[] }) {
  return (
    <DataTable
      data={data}
      rowKey="id"
      noun="volunteer"
      filterFields={[{ key: "Status", label: "Status" }]}
    />
  );
}
