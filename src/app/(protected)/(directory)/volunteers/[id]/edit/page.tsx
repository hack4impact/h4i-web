import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default async function EditVolunteerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return (
    <div>
      <PageHeader title="Volunteer">
        <Button variant="secondary">Cancel</Button>
        <Button variant="dark">Save Changes</Button>
      </PageHeader>
    </div>
  );
}
