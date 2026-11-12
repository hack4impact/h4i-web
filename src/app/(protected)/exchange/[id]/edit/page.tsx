import { notFound } from "next/navigation";
import { ListingForm } from "@/components/exchange/ListingForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getViewer } from "@/lib/graphql/handler";
import { listingsApi } from "@/lib/sourced-projects/listings-server";
import { canManageListing } from "@/lib/sourced-projects/permissions";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing, viewer] = await Promise.all([
    listingsApi.listing(id),
    getViewer(),
  ]);
  // Same 404 for missing and not-yours, so the page doesn't reveal which.
  if (
    !listing ||
    !viewer ||
    !canManageListing(viewer, listing.sourcingChapter.id)
  ) {
    notFound();
  }

  return (
    <div className="h-full overflow-y-auto pt-32">
      <PageHeader
        title="Edit project"
        subtitle="Saving also marks the listing as verified today."
      />
      <div className="px-32 pt-24 pb-48">
        <ListingForm listing={listing} />
      </div>
    </div>
  );
}
