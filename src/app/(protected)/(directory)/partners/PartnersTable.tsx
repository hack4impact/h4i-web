"use client";

import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge, BadgeColor } from "@/components/ui/StatusBadge";

type Props = { data: Record<string, string>[]; columns: string[] };

const statusColors: Record<string, BadgeColor> = {
  Active: "green",
  Inactive: "grey",
  Prospect: "blue",
};

export function PartnersTable({ data, columns }: Props) {
  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey="id"
      noun="partner"
      filterFields={[
        { key: "Status", label: "Status" },
        { key: "Organization Type", label: "Organization Type" },
      ]}
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
