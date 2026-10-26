import { createGraphQLError, createSchema } from "graphql-yoga";
import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { db } from "@/lib/db";
import {
  listingSelect,
  toListingView,
  type Viewer,
} from "@/lib/sourced-projects/contact-gating";
import {
  createListingInput,
  MAX_SEARCH_LENGTH,
  updateListingInput,
  type CreateListingInput,
} from "@/lib/sourced-projects/listing-input";
import { canManageListing } from "@/lib/sourced-projects/permissions";

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

  input ListingLinkInput {
    label: String!
    url: String!
    linkType: LinkType
  }

  input CreateListingInput {
    "Defaults to the viewer's chapter. Required for admins without a chapter."
    sourcingChapterId: ID
    title: String!
    description: String!
    scope: String!
    causeArea: CauseArea!
    techContext: String
    handoffNotes: String!
    clientOrgName: String!
    clientContactName: String!
    clientContactEmail: String!
    clientContactPhone: String
    partnerNotes: String
    links: [ListingLinkInput!]
  }

  "Omitted fields are left unchanged. Passing links replaces the whole set."
  input UpdateListingInput {
    title: String
    description: String
    scope: String
    causeArea: CauseArea
    techContext: String
    handoffNotes: String
    clientOrgName: String
    clientContactName: String
    clientContactEmail: String
    clientContactPhone: String
    partnerNotes: String
    links: [ListingLinkInput!]
  }

  type Query {
    """
    Listings from every chapter, newest first. Withdrawn listings are excluded.
    \`search\` matches title, description, and scope (case-insensitive) and
    combines with \`filter\`.
    """
    listings(
      first: Int
      after: String
      filter: ListingFilter
      search: String
    ): ListingConnection!
    listing(id: ID!): Listing
  }

  "Restricted to chapter leaders of the sourcing chapter and admins."
  type Mutation {
    createListing(input: CreateListingInput!): Listing!
    updateListing(id: ID!, input: UpdateListingInput!): Listing!
    "Hides the listing from every query. Listings are never hard-deleted."
    withdrawListing(id: ID!): Listing!
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
  search?: string | null;
};

function requireViewer(ctx: GraphQLContext): Viewer {
  if (!ctx.viewer) {
    throw createGraphQLError("Not signed in", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return ctx.viewer;
}

function userError(
  code: "BAD_USER_INPUT" | "FORBIDDEN" | "NOT_FOUND",
  message: string,
  extensions: Record<string, unknown> = {}
) {
  return createGraphQLError(message, { extensions: { code, ...extensions } });
}

function parseInput<T extends z.ZodType>(schema: T, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw userError("BAD_USER_INPUT", "Invalid listing input", {
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
  return result.data as z.output<T>;
}

// Resolves a live listing the viewer may modify, or throws.
async function requireManageableListing(viewer: Viewer, id: string) {
  const listing = await db.sourcedProject.findFirst({
    where: { id, withdrawnAt: null },
    select: { id: true, sourcingChapterId: true },
  });
  if (!listing) throw userError("NOT_FOUND", "Listing not found");
  if (!canManageListing(viewer, listing.sourcingChapterId)) {
    throw userError(
      "FORBIDDEN",
      "Only the sourcing chapter or an admin can modify this listing"
    );
  }
  return listing;
}

const createLinks = (
  links: NonNullable<CreateListingInput["links"]>,
  viewer: Viewer
) => links.map((link) => ({ ...link, addedById: viewer.id }));

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

        const search = args.search?.trim();
        if (search) {
          if (search.length > MAX_SEARCH_LENGTH) {
            throw userError(
              "BAD_USER_INPUT",
              `Search must be at most ${MAX_SEARCH_LENGTH} characters`
            );
          }
          const contains = { contains: search, mode: "insensitive" } as const;
          where.OR = [
            { title: contains },
            { description: contains },
            { scope: contains },
          ];
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

    Mutation: {
      async createListing(_, args: { input: unknown }, ctx) {
        const viewer = requireViewer(ctx);
        const {
          sourcingChapterId: requestedChapterId,
          links,
          ...data
        } = parseInput(createListingInput, args.input);

        const sourcingChapterId = requestedChapterId ?? viewer.chapterId;
        if (!sourcingChapterId) {
          throw userError("BAD_USER_INPUT", "sourcingChapterId is required");
        }
        if (!canManageListing(viewer, sourcingChapterId)) {
          throw userError(
            "FORBIDDEN",
            "Only chapter leaders can post listings for their own chapter"
          );
        }
        const chapter = await db.chapter.findUnique({
          where: { id: sourcingChapterId },
          select: { id: true },
        });
        if (!chapter) throw userError("BAD_USER_INPUT", "Unknown chapter");

        const row = await db.sourcedProject.create({
          data: {
            ...data,
            sourcingChapterId,
            sourcedById: viewer.id,
            links: { create: createLinks(links ?? [], viewer) },
          },
          select: listingSelect(viewer),
        });
        return toListingView(row, viewer);
      },

      async updateListing(_, args: { id: string; input: unknown }, ctx) {
        const viewer = requireViewer(ctx);
        await requireManageableListing(viewer, args.id);
        const { links, ...data } = parseInput(updateListingInput, args.input);

        // An edit by the sourcing chapter counts as re-verifying the listing.
        const row = await db.sourcedProject.update({
          where: { id: args.id, withdrawnAt: null },
          data: {
            ...data,
            lastVerifiedAt: new Date(),
            ...(links && {
              links: { deleteMany: {}, create: createLinks(links, viewer) },
            }),
          },
          select: listingSelect(viewer),
        });
        return toListingView(row, viewer);
      },

      async withdrawListing(_, args: { id: string }, ctx) {
        const viewer = requireViewer(ctx);
        await requireManageableListing(viewer, args.id);
        const row = await db.sourcedProject.update({
          where: { id: args.id, withdrawnAt: null },
          data: { withdrawnAt: new Date() },
          select: listingSelect(viewer),
        });
        return toListingView(row, viewer);
      },
    },

    Listing: {
      postedAt: (parent) => toIso(parent, "postedAt"),
      lastVerifiedAt: (parent) => toIso(parent, "lastVerifiedAt"),
      updatedAt: (parent) => toIso(parent, "updatedAt"),
    },
  },
});
