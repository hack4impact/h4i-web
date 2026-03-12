"use client";

import { DataTable } from "@/components/ui/DataTable";

type Row = Record<string, string>;

export function ChaptersTable({ data }: { data: Row[] }) {
  return (
    <DataTable
      data={data}
      rowKey="id"
      noun="chapter"
      filterFields={[{ key: "Status", label: "Status" }]}
    />
  );
}
