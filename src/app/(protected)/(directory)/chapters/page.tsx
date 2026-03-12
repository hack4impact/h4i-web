import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getChapters } from "@/actions/chapters";
import type { Chapter } from "@/data/chapters";

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

export default async function ChaptersPage() {
  const chapters = await getChapters();

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Chapters Directory">
        <Button>+ Add Chapter</Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1 px-4 pb-4">
        <DataTable columns={columns} data={chapters} rowKey="id" />
      </div>
    </div>
  );
}
