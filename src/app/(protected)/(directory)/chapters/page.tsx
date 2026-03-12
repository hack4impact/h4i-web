import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getChapters } from "@/actions/chapters";
import { ChaptersTable } from "./ChaptersTable";

export default async function ChaptersPage() {
  const chapters = await getChapters();

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Chapters Directory">
        <Button>+ Add Chapter</Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1 px-4 pb-4">
        <ChaptersTable data={chapters} />
      </div>
    </div>
  );
}
