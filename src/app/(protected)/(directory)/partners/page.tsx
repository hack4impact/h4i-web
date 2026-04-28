import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { partners } from "@/lib/data";
import { PartnersTable } from "./PartnersTable";

export default function PartnersPage() {
  return (
    <div className="flex h-full flex-col pt-32">
      <PageHeader title="Partners Directory">
        <Button variant="high-contrast" className="h-full">
          + Add Partner
        </Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1 p-32">
        <PartnersTable data={partners} />
      </div>
    </div>
  );
}
