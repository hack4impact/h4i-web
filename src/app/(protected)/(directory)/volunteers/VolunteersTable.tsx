"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Badge, BadgeColor } from "@/components/ui/Badge";
import { useRouter } from "next/navigation";

type Props = { data: Record<string, string>[] };

const statusColors: Record<string, BadgeColor> = {
  Active: "green",
  Inactive: "grey",
  Alumni: "grey",
};

export function VolunteersTable({ data }: Props) {
  const router = useRouter();

  return (
    <DataTable
      data={data}
      columns={[
        "Name",
        "Status",
        "Roles",
        "Major",
        "Graduation Year",
        "School Email",
      ]}
      rowKey="id"
      noun="volunteer"
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
      onRowClick={(row) => router.push(`/volunteers/${row.id}`)}
    />
  );
}
