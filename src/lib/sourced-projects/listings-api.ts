import type { CauseArea, LinkType, SourcedProjectStatus } from "@prisma/client";
import type { GraphQLRequest } from "@/lib/graphql/request";

export const LISTINGS_PAGE_SIZE = 12;

// Typed wrapper for the listings queries and mutations. Field lists and result
// types live together so a query change shows up as a type error in the UI.

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
  query Listings(
    $first: Int
    $after: String
    $filter: ListingFilter
    $search: String
  ) {
    listings(first: $first, after: $after, filter: $filter, search: $search) {
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
      contact {
        clientOrgName
        clientContactName
        clientContactEmail
        clientContactPhone
        partnerNotes
      }
    }
  }
`;

const CHAPTERS_QUERY = /* GraphQL */ `
  query Chapters {
    chapters {
      id
      name
    }
  }
`;

const CREATE_LISTING = /* GraphQL */ `
  mutation CreateListing($input: CreateListingInput!) {
    createListing(input: $input) {
      id
    }
  }
`;

const UPDATE_LISTING = /* GraphQL */ `
  mutation UpdateListing($id: ID!, $input: UpdateListingInput!) {
    updateListing(id: $id, input: $input) {
      id
    }
  }
`;

const WITHDRAW_LISTING = /* GraphQL */ `
  mutation WithdrawListing($id: ID!) {
    withdrawListing(id: $id) {
      id
    }
  }
`;

export type Chapter = { id: string; name: string };

export type ListingSummary = {
  id: string;
  title: string;
  causeArea: CauseArea;
  status: SourcedProjectStatus;
  postedAt: string;
  sourcingChapter: Chapter;
  // Null unless the viewer is a chapter leader or admin.
  contact: { clientOrgName: string } | null;
};

export type ListingContact = {
  clientOrgName: string;
  clientContactName: string;
  clientContactEmail: string;
  clientContactPhone: string | null;
  partnerNotes: string | null;
};

export type ListingLink = { label: string; url: string; linkType: LinkType };

export type ListingDetail = Omit<ListingSummary, "contact"> & {
  description: string;
  scope: string;
  techContext: string | null;
  handoffNotes: string;
  lastVerifiedAt: string;
  links: (ListingLink & { id: string })[];
  contact: ListingContact | null;
};

export type ListingsPage = {
  nodes: ListingSummary[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  totalCount: number;
};

export type ListingFilter = {
  status?: SourcedProjectStatus;
  causeArea?: CauseArea;
  sourcingChapterId?: string;
};

export type ListingsQuery = { filter?: ListingFilter; search?: string };

// The fields a chapter edits. `sourcingChapterId` is only sent on create.
export type ListingInput = ListingContact & {
  title: string;
  description: string;
  scope: string;
  causeArea: CauseArea;
  techContext: string | null;
  handoffNotes: string;
  links: ListingLink[];
};

export function createListingsApi(request: GraphQLRequest) {
  return {
    async listings({
      first = LISTINGS_PAGE_SIZE,
      after = null,
      filter,
      search,
    }: ListingsQuery & { first?: number; after?: string | null } = {}) {
      const data = await request<{ listings: ListingsPage }>(LISTINGS_QUERY, {
        first,
        after,
        filter,
        search,
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

    async chapters() {
      const data = await request<{ chapters: Chapter[] }>(CHAPTERS_QUERY);
      return data.chapters;
    },

    async createListing(
      input: ListingInput & { sourcingChapterId?: string | null }
    ) {
      const data = await request<{ createListing: { id: string } }>(
        CREATE_LISTING,
        { input }
      );
      return data.createListing;
    },

    async updateListing(id: string, input: ListingInput) {
      const data = await request<{ updateListing: { id: string } }>(
        UPDATE_LISTING,
        { id, input }
      );
      return data.updateListing;
    },

    async withdrawListing(id: string) {
      const data = await request<{ withdrawListing: { id: string } }>(
        WITHDRAW_LISTING,
        { id }
      );
      return data.withdrawListing;
    },
  };
}
