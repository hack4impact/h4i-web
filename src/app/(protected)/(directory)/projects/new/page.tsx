import { requireRole, EDITOR_ROLES } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default async function NewProjectPage() {
  await requireRole(EDITOR_ROLES);
  return (
    <div>
      <PageHeader title="Add Project">
        <Button variant="secondary">Cancel</Button>
        <Button>+ Add Project</Button>
      </PageHeader>
    </div>
  );
}
