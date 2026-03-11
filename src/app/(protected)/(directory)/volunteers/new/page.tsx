import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default function NewVolunteerPage() {
  return (
    <div>
      <PageHeader title="Add Volunteer">
        <Button variant="secondary">Cancel</Button>
        <Button>+ Add Volunteer</Button>
      </PageHeader>
    </div>
  );
}
