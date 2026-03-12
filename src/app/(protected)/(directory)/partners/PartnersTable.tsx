"use client";

import { DataTable } from "@/components/ui/DataTable";

type Row = Record<string, string>;

export function PartnersTable({ data }: { data: Row[] }) {
  return (
    <DataTable
      data={data}
      rowKey="id"
      noun="partner"
      filterFields={[
        { key: "Status", label: "Status" },
        { key: "Organization Type", label: "Organization Type" },
      ]}
    />
  );
}
