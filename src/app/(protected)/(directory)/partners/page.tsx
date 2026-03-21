import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getPartners } from "@/actions/partners";
import { PartnersTable } from "./PartnersTable";

export default async function PartnersPage() {
  const { rows } = await getPartners();

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Partners Directory">
        <Button>+ Add Partner</Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1 p-8">
        <PartnersTable data={rows} />
      </div>
    </div>
  );
}
