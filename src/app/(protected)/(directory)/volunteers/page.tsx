import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getVolunteers } from "@/actions/volunteers";
import { VolunteersTable } from "./VolunteersTable";

export default async function VolunteersPage() {
  const { rows, columns } = await getVolunteers();

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Volunteers Directory">
        <Button>+ Add Volunteer</Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1 px-4 pb-4">
        <VolunteersTable data={rows} columns={columns} />
      </div>
    </div>
  );
}
