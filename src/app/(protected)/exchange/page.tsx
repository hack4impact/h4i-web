import Link from "next/link";
import { Plus } from "lucide-react";
import { ListingFilters } from "@/components/exchange/ListingFilters";
import { PageHeader } from "@/components/ui/PageHeader";
import { getViewer } from "@/lib/graphql/handler";
import {
  hasListingQuery,
  parseListingSearchParams,
} from "@/lib/sourced-projects/listing-search";
import { listingsApi } from "@/lib/sourced-projects/listings-server";
import { canPostListing } from "@/lib/sourced-projects/permissions";
import { ListingGrid } from "./ListingGrid";

export default async function ExchangePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseListingSearchParams(await searchParams);
  const [firstPage, chapters, viewer] = await Promise.all([
    listingsApi.listings(query),
    listingsApi.chapters(),
    getViewer(),
  ]);
  const filtered = hasListingQuery(query);

  return (
    <div className="h-full overflow-y-auto pt-32">
      <PageHeader
        title="Explore projects"
        subtitle="Find opportunities that fit your chapter."
      >
        {viewer && canPostListing(viewer) && (
          <Link
            href="/exchange/new"
            className="btn btn-high-contrast btn-lg h-full"
          >
            <Plus size={12} strokeWidth={1.75} />
            Post a project
          </Link>
        )}
      </PageHeader>
      <div className="px-32 pt-16">
        <ListingFilters query={query} chapters={chapters} />
      </div>
      <section aria-labelledby="all-projects" className="px-32 pt-24 pb-48">
        <div className="flex items-baseline justify-between pb-16">
          <h2 id="all-projects" className="text-gray-1 text-xl">
            {filtered ? "Results" : "All projects"}
          </h2>
          <span className="text-gray-3 tabular-nums" aria-live="polite">
            {firstPage.totalCount.toLocaleString()}{" "}
            {firstPage.totalCount === 1 ? "project" : "projects"}
          </span>
        </div>
        {/* A new query starts a fresh grid instead of appending to the old one. */}
        <ListingGrid
          key={JSON.stringify(query)}
          initial={firstPage}
          query={query}
        />
      </section>
    </div>
  );
}
