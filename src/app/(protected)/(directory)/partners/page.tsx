import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { getPartners } from "@/actions/partners";
import type { Partner } from "@/data/partners";

const columns: Column<Partner>[] = [
  { key: "organization", label: "Organization" },
  { key: "type", label: "Type" },
  { key: "projects", label: "Projects", render: (row) => row.projects ?? "—" },
  { key: "chapter", label: "Chapter" },
  { key: "since", label: "Since", render: (row) => row.since || "—" },
];

export default async function PartnersPage() {
  const partners = await getPartners();

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Partners Directory">
        <Button>+ Add Partner</Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1 px-4 pb-4">
        <DataTable columns={columns} data={partners} rowKey="id" />
      </div>
    </div>
  );
}
