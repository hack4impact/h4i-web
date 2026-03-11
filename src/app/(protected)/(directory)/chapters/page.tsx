import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { chapters, type Chapter } from "@/data/chapters";

const columns: Column<Chapter>[] = [
  { key: "name", label: "Chapter" },
  { key: "university", label: "University" },
  { key: "volunteers", label: "Volunteers" },
  { key: "projects", label: "Projects", render: (row) => row.projects ?? "—" },
  {
    key: "coExecDirectors",
    label: "Co-Exec Directors",
    render: (row) => row.coExecDirectors ?? "—",
  },
  {
    key: "status",
    label: "Status",
    render: (row) => <StatusBadge status={row.status} />,
  },
];

export default function ChaptersPage() {
  return (
    <div>
      <PageHeader title="Chapters Directory">
        <Button>+ Add Chapter</Button>
      </PageHeader>
      <div className="px-4 pb-4">
        <div className="border-border bg-card overflow-hidden rounded-md border">
          <DataTable columns={columns} data={chapters} rowKey="id" />
        </div>
      </div>
    </div>
  );
}
