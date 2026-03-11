import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default async function EditPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return (
    <div>
      <PageHeader title="Partner">
        <Button variant="secondary">Cancel</Button>
        <Button variant="dark">Save Changes</Button>
      </PageHeader>
    </div>
  );
}
