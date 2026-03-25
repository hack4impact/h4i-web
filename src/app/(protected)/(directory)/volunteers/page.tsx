import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getVolunteers } from "@/actions/volunteers";
import { VolunteersTable } from "./VolunteersTable";

export default async function VolunteersPage() {
  const { rows } = await getVolunteers();

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Volunteers Directory">
        <Button>+ Add Volunteer</Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1 p-32">
        <VolunteersTable data={rows} />
      </div>
    </div>
  );
}
