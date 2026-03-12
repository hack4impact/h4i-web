"use client";

import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge, BadgeColor } from "@/components/ui/StatusBadge";

type Row = Record<string, string>;

const statusColors: Record<string, BadgeColor> = {
  Active: "green",
  Inactive: "grey",
  Alumni: "grey",
};

export function VolunteersTable({ data }: { data: Row[] }) {
  return (
    <DataTable
      data={data}
      rowKey="id"
      noun="volunteer"
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
