import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default function NewChapterPage() {
  return (
    <div>
      <PageHeader title="Add Chapter">
        <Button variant="secondary">Cancel</Button>
        <Button>+ Add Chapter</Button>
      </PageHeader>
    </div>
  );
}
