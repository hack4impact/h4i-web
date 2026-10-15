import { createGraphQLError, createSchema } from "graphql-yoga";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  listingSelect,
  toListingView,
  type Viewer,
} from "@/lib/sourced-projects/contact-gating";

export type GraphQLContext = { viewer: Viewer | null };

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const typeDefs = /* GraphQL */ `
  enum SourcedProjectStatus {
    AVAILABLE
    CLAIM_PENDING
    CLAIMED
    IN_PROGRESS
    COMPLETED
    ARCHIVED
  }

  enum CauseArea {
    HEALTH
    EDUCATION
    FOOD_SECURITY
    HOUSING
    ENVIRONMENT
    ECONOMIC_OPPORTUNITY
    ARTS_AND_CULTURE
    CIVIC_ENGAGEMENT
    OTHER
  }

  enum LinkType {
    REPO
    SCOPING_DOC
    DESIGN_FILE
    DELIVERABLE
    OTHER
  }

  type Chapter {
    id: ID!
    name: String!
    region: String
  }

  type ListingLink {
    id: ID!
    label: String!
    url: String!
    linkType: LinkType!
  }

  "Only visible to chapter leaders and admins; null for everyone else."
  type ListingContact {
    clientOrgName: String!
    clientContactName: String!
    clientContactEmail: String!
    clientContactPhone: String
    partnerNotes: String
  }

  type Listing {
    id: ID!
    title: String!
    description: String!
    scope: String!
    causeArea: CauseArea!
    techContext: String
    status: SourcedProjectStatus!
    handoffNotes: String!
    postedAt: String!
    lastVerifiedAt: String!
    updatedAt: String!
    sourcingChapter: Chapter!
    links: [ListingLink!]!
    contact: ListingContact
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type ListingConnection {
    nodes: [Listing!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  input ListingFilter {
    status: SourcedProjectStatus
    causeArea: CauseArea
    sourcingChapterId: ID
  }

  type Query {
    "Listings from every chapter, newest first. Withdrawn listings are excluded."
    listings(
      first: Int
      after: String
      filter: ListingFilter
    ): ListingConnection!
    listing(id: ID!): Listing
  }
`;

type ListingsArgs = {
  first?: number | null;
  after?: string | null;
  filter?: {
    status?: Prisma.SourcedProjectWhereInput["status"] | null;
    causeArea?: Prisma.SourcedProjectWhereInput["causeArea"] | null;
    sourcingChapterId?: string | null;
  } | null;
};

function requireViewer(ctx: GraphQLContext): Viewer {
  if (!ctx.viewer) {
    throw createGraphQLError("Not signed in", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return ctx.viewer;
}

const toIso = (parent: Record<string, unknown>, key: string) =>
  (parent[key] as Date).toISOString();

export const schema = createSchema<GraphQLContext>({
  typeDefs,
  resolvers: {
    Query: {
      async listings(_, args: ListingsArgs, ctx) {
        const viewer = requireViewer(ctx);
        const take = Math.min(
          Math.max(args.first ?? DEFAULT_PAGE_SIZE, 1),
          MAX_PAGE_SIZE
        );

        const where: Prisma.SourcedProjectWhereInput = { withdrawnAt: null };
        if (args.filter?.status) where.status = args.filter.status;
        if (args.filter?.causeArea) where.causeArea = args.filter.causeArea;
        if (args.filter?.sourcingChapterId) {
          where.sourcingChapterId = args.filter.sourcingChapterId;
        }

        const [rows, totalCount] = await Promise.all([
          db.sourcedProject.findMany({
            where,
            select: listingSelect(viewer),
            orderBy: [{ postedAt: "desc" }, { id: "desc" }],
            take: take + 1,
            ...(args.after ? { cursor: { id: args.after }, skip: 1 } : {}),
          }),
          db.sourcedProject.count({ where }),
        ]);

        const page = rows.slice(0, take);
        return {
          nodes: page.map((row) => toListingView(row, viewer)),
          pageInfo: {
            hasNextPage: rows.length > take,
            endCursor: page.at(-1)?.id ?? null,
          },
          totalCount,
        };
      },

      async listing(_, args: { id: string }, ctx) {
        const viewer = requireViewer(ctx);
        const row = await db.sourcedProject.findFirst({
          where: { id: args.id, withdrawnAt: null },
          select: listingSelect(viewer),
        });
        return row ? toListingView(row, viewer) : null;
      },
    },

    Listing: {
      postedAt: (parent) => toIso(parent, "postedAt"),
      lastVerifiedAt: (parent) => toIso(parent, "lastVerifiedAt"),
      updatedAt: (parent) => toIso(parent, "updatedAt"),
    },
  },
});
