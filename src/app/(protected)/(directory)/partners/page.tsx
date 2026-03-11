import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { partners, type Partner } from "@/data/partners";

const columns: Column<Partner>[] = [
  { key: "organization", label: "Organization" },
  { key: "type", label: "Type" },
  { key: "projects", label: "Projects", render: (row) => row.projects ?? "—" },
  { key: "chapter", label: "Chapter" },
  { key: "since", label: "Since" },
];

export default function PartnersPage() {
  return (
    <div>
      <PageHeader title="Partners Directory">
        <Button>+ Add Partner</Button>
      </PageHeader>
      <div className="px-4 pb-4">
        <div className="border-border bg-card overflow-hidden rounded-md border">
          <DataTable columns={columns} data={partners} rowKey="id" />
        </div>
      </div>
    </div>
  );
}
