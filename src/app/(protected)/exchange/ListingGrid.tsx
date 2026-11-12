"use client";

import { useState } from "react";
import { ProjectInfoCard } from "@/components/exchange/ProjectInfoCard";
import { Button } from "@/components/ui/Button";
import { browserRequest } from "@/lib/graphql/request";
import { hasListingQuery } from "@/lib/sourced-projects/listing-search";
import {
  createListingsApi,
  type ListingsPage,
  type ListingsQuery,
} from "@/lib/sourced-projects/listings-api";

const listingsApi = createListingsApi(browserRequest);

// The first page is rendered on the server; later pages load from the browser
// with the same search and filters.
export function ListingGrid({
  initial,
  query,
}: {
  initial: ListingsPage;
  query: ListingsQuery;
}) {
  const [nodes, setNodes] = useState(initial.nodes);
  const [pageInfo, setPageInfo] = useState(initial.pageInfo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function loadMore() {
    setLoading(true);
    setError(false);
    try {
      const page = await listingsApi.listings({
        ...query,
        after: pageInfo.endCursor,
      });
      setNodes((current) => [...current, ...page.nodes]);
      setPageInfo(page.pageInfo);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (nodes.length === 0) {
    return (
      <p className="text-gray-3">
        {hasListingQuery(query)
          ? "No projects match your search and filters."
          : "No projects have been posted yet."}
      </p>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-16 md:grid-cols-2 xl:grid-cols-3">
        {nodes.map((listing) => (
          <li key={listing.id}>
            <ProjectInfoCard listing={listing} />
          </li>
        ))}
      </ul>
      {pageInfo.hasNextPage && (
        <div className="flex flex-col items-center gap-8 pt-24">
          <Button size="lg" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
          {error && (
            <p role="alert" className="text-red">
              Couldn&apos;t load more projects. Try again.
            </p>
          )}
        </div>
      )}
    </>
  );
}
