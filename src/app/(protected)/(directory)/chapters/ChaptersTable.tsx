"use client";

import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge, BadgeColor } from "@/components/ui/StatusBadge";

type Row = Record<string, string>;

const statusColors: Record<string, BadgeColor> = {
  Active: "green",
  Forming: "blue",
  Scoping: "blue",
  Inactive: "grey",
  Hiatus: "orange",
};

export function ChaptersTable({ data }: { data: Row[] }) {
  return (
    <DataTable
      data={data}
      rowKey="id"
      noun="chapter"
      filterFields={[{ key: "Status", label: "Status" }]}
      columnConfig={[
        {
          key: "Status",
          render: (val) => (
            <StatusBadge label={val} color={statusColors[val] ?? "grey"} />
          ),
        },
      ]}
    />
  );
}
