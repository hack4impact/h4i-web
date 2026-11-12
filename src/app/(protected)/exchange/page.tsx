import { PageHeader } from "@/components/ui/PageHeader";
import { listingsApi } from "@/lib/sourced-projects/listings-server";
import { ListingGrid } from "./ListingGrid";

export default async function ExchangePage() {
  const firstPage = await listingsApi.listings();

  return (
    <div className="h-full overflow-y-auto pt-32">
      <PageHeader
        title="Explore projects"
        subtitle="Find opportunities that fit your chapter."
      />
      <section aria-labelledby="all-projects" className="px-32 pt-24 pb-48">
        <div className="flex items-baseline justify-between pb-16">
          <h2 id="all-projects" className="text-gray-1 text-xl">
            All projects
          </h2>
          <span className="text-gray-3 tabular-nums">
            {firstPage.totalCount.toLocaleString()}{" "}
            {firstPage.totalCount === 1 ? "project" : "projects"}
          </span>
        </div>
        <ListingGrid initial={firstPage} />
      </section>
    </div>
  );
}
