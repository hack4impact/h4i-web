import { requireRole, EDITOR_ROLES } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default async function NewVolunteerPage() {
  await requireRole(EDITOR_ROLES);
  return (
    <div>
      <PageHeader title="Add Volunteer">
        <Button variant="secondary">Cancel</Button>
        <Button>+ Add Volunteer</Button>
      </PageHeader>
    </div>
  );
}
