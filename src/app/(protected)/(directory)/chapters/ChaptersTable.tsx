"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Badge, BadgeColor } from "@/components/ui/Badge";

type Props = { data: Record<string, string>[] };

const statusColors: Record<string, BadgeColor> = {
  Active: "green",
  Forming: "blue",
  Scoping: "blue",
  Inactive: "grey",
  Hiatus: "orange",
};

export function ChaptersTable({ data }: Props) {
  return (
    <DataTable
      data={data}
      columns={["Name", "Status", "Place", "Founded", "Email"]}
      rowKey="id"
      noun="chapter"
      defaultSort={{ key: "Name", dir: "asc" }}
      filterFields={[{ key: "Status", label: "Status" }]}
      columnConfig={[
        {
          key: "Status",
          render: (val) => (
            <Badge label={val} color={statusColors[val] ?? "grey"} />
          ),
        },
      ]}
    />
  );
}
