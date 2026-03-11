import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default function NewProjectPage() {
  return (
    <div>
      <PageHeader title="Add Project">
        <Button variant="secondary">Cancel</Button>
        <Button>+ Add Project</Button>
      </PageHeader>
    </div>
  );
}
