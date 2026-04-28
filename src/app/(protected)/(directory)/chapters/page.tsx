import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { chapters } from "@/lib/data";
import { ChaptersTable } from "./ChaptersTable";

export default function ChaptersPage() {
  return (
    <div className="flex h-full flex-col pt-32">
      <PageHeader title="Chapters Directory">
        <Button variant="high-contrast" className="h-full">
          + Add Chapter
        </Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1 p-32">
        <ChaptersTable data={chapters} />
      </div>
    </div>
  );
}
