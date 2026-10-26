// Runs against the seeded dev database (`pnpm prisma db seed`).
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  GATED_FIELDS,
  toListingView,
  type Viewer,
} from "@/lib/sourced-projects/contact-gating";
import { ADMIN, LEAD, run, VOLUNTEER } from "./helpers";

const LISTING_FIELDS = /* GraphQL */ `
  id
  title
  sourcingChapter { id }
  contact {
    clientOrgName
    clientContactName
    clientContactEmail
    clientContactPhone
    partnerNotes
  }
`;

const LISTINGS = /* GraphQL */ `
  query ($first: Int, $after: String) {
    listings(first: $first, after: $after) {
      nodes { ${LISTING_FIELDS} }
      pageInfo { hasNextPage endCursor }
      totalCount
    }
  }
`;

const LISTING = /* GraphQL */ `
  query ($id: ID!) {
    listing(id: $id) { ${LISTING_FIELDS} }
  }
`;

type ListingNode = {
  id: string;
  sourcingChapter: { id: string };
  contact: Record<string, string | null> | null;
};

// Walks every page in small steps so pagination is exercised too.
async function fetchAllListings(viewer: Viewer) {
  const nodes: ListingNode[] = [];
  const rawPages: string[] = [];
  let after: string | null = null;
  let totalCount = 0;

  do {
    const result = await run(LISTINGS, viewer, { first: 4, after });
    expect(result.errors).toBeUndefined();
    rawPages.push(result.raw);
    const { listings } = result.data as {
      listings: {
        nodes: ListingNode[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        totalCount: number;
      };
    };
    const { nodes: page, pageInfo } = listings;
    totalCount = listings.totalCount;
    nodes.push(...page);
    after = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  } while (after);

  return { nodes, rawPages, totalCount };
}

async function gatedValuesInDb() {
  const rows = await db.sourcedProject.findMany();
  return rows
    .flatMap((row) => GATED_FIELDS.map((field) => row[field]))
    .filter((v): v is string => typeof v === "string" && v.length > 0);
}

afterAll(async () => {
  await db.$disconnect();
});

describe("toListingView", () => {
  it("drops gated fields for a volunteer even when they were selected", () => {
    const row = {
      id: "x",
      clientOrgName: "Org",
      clientContactName: "Name",
      clientContactEmail: "a@b.org",
      clientContactPhone: "555",
      partnerNotes: "notes",
    } as unknown as Parameters<typeof toListingView>[0];

    const view = toListingView(row, VOLUNTEER);

    expect(view.contact).toBeNull();
    for (const field of GATED_FIELDS) expect(view).not.toHaveProperty(field);
  });
});

describe("listings query", () => {
  it("returns non-withdrawn listings from every chapter", async () => {
    const { nodes, totalCount } = await fetchAllListings(VOLUNTEER);
    const expected = await db.sourcedProject.count({
      where: { withdrawnAt: null },
    });
    const chapterCount = await db.chapter.count();

    expect(totalCount).toBe(expected);
    expect(nodes).toHaveLength(expected);
    expect(new Set(nodes.map((n) => n.id)).size).toBe(expected);
    expect(new Set(nodes.map((n) => n.sourcingChapter.id)).size).toBe(
      chapterCount
    );
  });

  it("never exposes contact fields to a volunteer", async () => {
    const { nodes, rawPages } = await fetchAllListings(VOLUNTEER);
    const secrets = await gatedValuesInDb();
    expect(secrets.length).toBeGreaterThan(0);

    for (const node of nodes) expect(node.contact).toBeNull();
    for (const raw of rawPages) {
      for (const secret of secrets) expect(raw).not.toContain(secret);
    }
  });

  it.each([
    ["chapter leader", LEAD],
    ["admin", ADMIN],
  ])("includes contact fields for a %s", async (_, viewer) => {
    const { nodes } = await fetchAllListings(viewer);
    for (const node of nodes) {
      expect(node.contact?.clientContactEmail).toMatch(/@/);
    }
  });

  it("clamps page size", async () => {
    const result = await run(LISTINGS, ADMIN, { first: 1000 });
    const { nodes } = (result.data as { listings: { nodes: unknown[] } })
      .listings;
    expect(nodes.length).toBeLessThanOrEqual(50);
  });

  it("rejects unauthenticated requests", async () => {
    const result = await run(LISTINGS, null);
    expect(result.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
  });
});

describe("listing query", () => {
  it("never exposes contact fields to a volunteer", async () => {
    const row = await db.sourcedProject.findFirstOrThrow({
      where: { withdrawnAt: null },
    });
    const result = await run(LISTING, VOLUNTEER, { id: row.id });
    const { raw } = result;

    expect(result.errors).toBeUndefined();
    expect(
      (result.data as { listing: ListingNode }).listing.contact
    ).toBeNull();
    for (const field of GATED_FIELDS) {
      const value = row[field];
      if (value) expect(raw).not.toContain(value);
    }
  });

  it("returns contact fields to a chapter leader", async () => {
    const row = await db.sourcedProject.findFirstOrThrow({
      where: { withdrawnAt: null },
    });
    const result = await run(LISTING, LEAD, { id: row.id });
    expect((result.data as { listing: ListingNode }).listing.contact).toEqual({
      clientOrgName: row.clientOrgName,
      clientContactName: row.clientContactName,
      clientContactEmail: row.clientContactEmail,
      clientContactPhone: row.clientContactPhone,
      partnerNotes: row.partnerNotes,
    });
  });

  it("hides withdrawn listings", async () => {
    const withdrawn = await db.sourcedProject.findFirst({
      where: { withdrawnAt: { not: null } },
    });
    if (!withdrawn) return;
    const result = await run(LISTING, ADMIN, { id: withdrawn.id });
    expect((result.data as { listing: unknown }).listing).toBeNull();
  });
});
