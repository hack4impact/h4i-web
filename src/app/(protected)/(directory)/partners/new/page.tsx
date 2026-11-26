import { requireRole, EDITOR_ROLES } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default async function NewPartnerPage() {
  await requireRole(EDITOR_ROLES);
  return (
    <div>
      <PageHeader title="Add Partner">
        <Button variant="secondary">Cancel</Button>
        <Button>+ Add Partner</Button>
      </PageHeader>
    </div>
  );
}
