import { notFound } from "next/navigation";
import { ListingForm } from "@/components/exchange/ListingForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getViewer } from "@/lib/graphql/handler";
import { listingsApi } from "@/lib/sourced-projects/listings-server";
import { canPostListing } from "@/lib/sourced-projects/permissions";

export default async function NewListingPage() {
  const viewer = await getViewer();
  if (!viewer || !canPostListing(viewer)) notFound();

  // Leaders post for their own chapter; admins have none, so they pick one.
  const chapters =
    viewer.role === "ADMIN" ? await listingsApi.chapters() : undefined;

  return (
    <div className="h-full overflow-y-auto pt-32">
      <PageHeader
        title="Post a project"
        subtitle="Share a project your chapter sourced so another chapter can take it on."
      />
      <div className="px-32 pt-24 pb-48">
        <ListingForm chapters={chapters} />
      </div>
    </div>
  );
}
