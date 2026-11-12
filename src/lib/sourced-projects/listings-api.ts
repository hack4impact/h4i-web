import type { CauseArea, SourcedProjectStatus } from "@prisma/client";
import type { GraphQLRequest } from "@/lib/graphql/request";

export const LISTINGS_PAGE_SIZE = 12;

// Typed wrapper for the listings queries. Field lists and result types live
// together so a query change shows up as a type error in the UI.

const SUMMARY_FIELDS = /* GraphQL */ `
  id
  title
  causeArea
  status
  postedAt
  sourcingChapter { id name }
  contact { clientOrgName }
`;

const LISTINGS_QUERY = /* GraphQL */ `
  query Listings($first: Int, $after: String) {
    listings(first: $first, after: $after) {
      nodes { ${SUMMARY_FIELDS} }
      pageInfo { hasNextPage endCursor }
      totalCount
    }
  }
`;

const LISTING_QUERY = /* GraphQL */ `
  query Listing($id: ID!) {
    listing(id: $id) {
      ${SUMMARY_FIELDS}
      description
      scope
      techContext
      handoffNotes
      lastVerifiedAt
      links { id label url linkType }
    }
  }
`;

export type ListingSummary = {
  id: string;
  title: string;
  causeArea: CauseArea;
  status: SourcedProjectStatus;
  postedAt: string;
  sourcingChapter: { id: string; name: string };
  // Null unless the viewer is a chapter leader or admin.
  contact: { clientOrgName: string } | null;
};

export type ListingDetail = ListingSummary & {
  description: string;
  scope: string;
  techContext: string | null;
  handoffNotes: string;
  lastVerifiedAt: string;
  links: { id: string; label: string; url: string; linkType: string }[];
};

export type ListingsPage = {
  nodes: ListingSummary[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  totalCount: number;
};

export function createListingsApi(request: GraphQLRequest) {
  return {
    async listings({
      first = LISTINGS_PAGE_SIZE,
      after = null,
    }: { first?: number; after?: string | null } = {}) {
      const data = await request<{ listings: ListingsPage }>(LISTINGS_QUERY, {
        first,
        after,
      });
      return data.listings;
    },

    async listing(id: string) {
      const data = await request<{ listing: ListingDetail | null }>(
        LISTING_QUERY,
        { id }
      );
      return data.listing;
    },
  };
}
