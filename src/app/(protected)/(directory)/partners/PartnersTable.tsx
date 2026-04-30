"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Badge, BadgeColor } from "@/components/ui/Badge";
import { useRouter } from "next/navigation";

type Props = { data: Record<string, string>[] };

const statusColors: Record<string, BadgeColor> = {
  Active: "green",
  Inactive: "grey",
  Prospect: "blue",
};

export function PartnersTable({ data }: Props) {
  const router = useRouter();

  return (
    <DataTable
      data={data}
      columns={[
        "Name",
        "Status",
        "Organization Type",
        "Population",
        "Contact Name",
        "Email",
      ]}
      rowKey="id"
      noun="chapter"
      defaultSort={{ key: "Name", dir: "asc" }}
      filterFields={[
        { key: "Status", label: "Status" },
        { key: "Organization Type", label: "Organization Type" },
      ]}
      columnConfig={[
        {
          key: "Status",
          render: (val) => (
            <Badge label={val} color={statusColors[val] ?? "grey"} />
          ),
        },
      ]}
      onRowClick={(row) => router.push(`/partners/${row.id}`)}
    />
  );
}
