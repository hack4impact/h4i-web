import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { volunteers } from "@/lib/data";
import { VolunteersTable } from "./VolunteersTable";

export default function VolunteersPage() {
  return (
    <div className="flex h-full flex-col pt-32">
      <PageHeader title="Volunteers Directory">
        <Button variant="high-contrast" className="h-full">
          + Add Volunteer
        </Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1 p-32">
        <VolunteersTable data={volunteers} />
      </div>
    </div>
  );
}
