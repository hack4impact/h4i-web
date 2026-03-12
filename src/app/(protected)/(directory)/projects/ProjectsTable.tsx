"use client";

import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge, BadgeColor } from "@/components/ui/StatusBadge";

type Props = { data: Record<string, string>[] };

const statusColors: Record<string, BadgeColor> = {
  Active: "green",
  Forming: "blue",
  Scoping: "blue",
  Complete: "grey",
  Inactive: "grey",
  Hiatus: "orange",
};

export function ProjectsTable({ data }: Props) {
  return (
    <DataTable
      data={data}
      columns={["Name", "Status", "Type", "Description"]}
      rowKey="id"
      noun="project"
      defaultSort={{ key: "Name", dir: "asc" }}
      filterFields={[
        { key: "Status", label: "Status" },
        { key: "Type", label: "Type" },
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
