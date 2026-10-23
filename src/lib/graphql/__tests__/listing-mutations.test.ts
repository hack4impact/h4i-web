// Runs against the seeded dev database (`pnpm prisma db seed`). Listings
// created here are deleted again in afterAll.
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import type { Viewer } from "@/lib/sourced-projects/contact-gating";
import { ADMIN, LEAD, run, VOLUNTEER, type GraphQLResult } from "./helpers";

// LEAD leads Berkeley; these two are a leader and a volunteer elsewhere and in
// the same chapter respectively.
const OTHER_LEAD: Viewer = {
  id: "seed-user-lead-uiuc",
  role: "CHAPTER_LEADER",
  chapterId: "seed-chapter-uiuc",
};
const SAME_CHAPTER_VOLUNTEER: Viewer = {
  id: "seed-user-volunteer-berkeley",
  role: "VOLUNTEER",
  chapterId: "seed-chapter-berkeley",
};

const LISTING_FIELDS = /* GraphQL */ `
  id
  title
  description
  scope
  causeArea
  techContext
  status
  lastVerifiedAt
  sourcingChapter { id }
  links { label url linkType }
  contact { clientOrgName clientContactEmail clientContactPhone }
`;

const CREATE = /* GraphQL */ `
  mutation ($input: CreateListingInput!) {
    createListing(input: $input) { ${LISTING_FIELDS} }
  }
`;

const UPDATE = /* GraphQL */ `
  mutation ($id: ID!, $input: UpdateListingInput!) {
    updateListing(id: $id, input: $input) { ${LISTING_FIELDS} }
  }
`;

const WITHDRAW = /* GraphQL */ `
  mutation ($id: ID!) {
    withdrawListing(id: $id) {
      id
    }
  }
`;

const LISTING = /* GraphQL */ `
  query ($id: ID!) {
    listing(id: $id) {
      id
    }
  }
`;

const SEARCH = /* GraphQL */ `
  query ($search: String, $filter: ListingFilter) {
    listings(first: 50, search: $search, filter: $filter) {
      nodes {
        id
        status
        causeArea
        sourcingChapter {
          id
        }
      }
      totalCount
    }
  }
`;

type Listing = {
  id: string;
  title: string;
  description: string;
  scope: string;
  causeArea: string;
  techContext: string | null;
  lastVerifiedAt: string;
  sourcingChapter: { id: string };
  links: { label: string; url: string; linkType: string }[];
  contact: Record<string, string | null> | null;
};

type SearchNode = {
  id: string;
  status: string;
  causeArea: string;
  sourcingChapter: { id: string };
};

const createdIds: string[] = [];

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Volunteer shift scheduler",
    description: "Replace a shared spreadsheet with a small web app.",
    scope: "Scheduling, reminders, and an admin view.",
    causeArea: "FOOD_SECURITY",
    techContext: "Currently Google Sheets",
    handoffNotes: "Client prefers email; responds within a week.",
    clientOrgName: "Test Food Bank",
    clientContactName: "Test Contact",
    clientContactEmail: "contact@testfoodbank.org",
    links: [{ label: "Scoping doc", url: "https://example.org/scope" }],
    ...overrides,
  };
}

async function create(
  viewer: Viewer,
  overrides: Record<string, unknown> = {}
): Promise<Listing> {
  const result = await run(CREATE, viewer, { input: validInput(overrides) });
  expect(result.errors).toBeUndefined();
  const listing = (result.data as { createListing: Listing }).createListing;
  createdIds.push(listing.id);
  return listing;
}

const errorCode = (result: GraphQLResult) =>
  result.errors?.[0]?.extensions.code;

const issuePaths = (result: GraphQLResult) =>
  (
    result.errors?.[0]?.extensions.issues as { path: string }[] | undefined
  )?.map((issue) => issue.path);

async function search(
  viewer: Viewer,
  variables: { search?: string; filter?: Record<string, unknown> }
) {
  const result = await run(SEARCH, viewer, variables);
  expect(result.errors).toBeUndefined();
  return (
    result.data as { listings: { nodes: SearchNode[]; totalCount: number } }
  ).listings;
}

afterAll(async () => {
  await db.sourcedProject.deleteMany({ where: { id: { in: createdIds } } });
  await db.$disconnect();
});

describe("createListing", () => {
  it("posts a listing for the leader's own chapter", async () => {
    const listing = await create(LEAD);

    expect(listing.sourcingChapter.id).toBe(LEAD.chapterId);
    expect(listing.contact?.clientContactEmail).toBe(
      "contact@testfoodbank.org"
    );
    expect(listing.links).toEqual([
      {
        label: "Scoping doc",
        url: "https://example.org/scope",
        linkType: "OTHER",
      },
    ]);
    const row = await db.sourcedProject.findUniqueOrThrow({
      where: { id: listing.id },
    });
    expect(row.sourcedById).toBe(LEAD.id);
    expect(row.status).toBe("AVAILABLE");
  });

  it("trims text and stores blank optional fields as null", async () => {
    const listing = await create(LEAD, {
      title: "  Padded title  ",
      techContext: "   ",
    });
    expect(listing.title).toBe("Padded title");
    expect(listing.techContext).toBeNull();
  });

  it("lets an admin post for any chapter", async () => {
    const listing = await create(ADMIN, {
      sourcingChapterId: "seed-chapter-gt",
    });
    expect(listing.sourcingChapter.id).toBe("seed-chapter-gt");
  });

  it("requires an admin without a chapter to name one", async () => {
    const result = await run(CREATE, ADMIN, { input: validInput() });
    expect(errorCode(result)).toBe("BAD_USER_INPUT");
  });

  it("rejects an unknown chapter", async () => {
    const result = await run(CREATE, ADMIN, {
      input: validInput({ sourcingChapterId: "no-such-chapter" }),
    });
    expect(errorCode(result)).toBe("BAD_USER_INPUT");
  });

  it.each([
    ["a volunteer", VOLUNTEER, undefined],
    ["a leader posting for another chapter", LEAD, "seed-chapter-uiuc"],
  ])("forbids %s", async (_, viewer, sourcingChapterId) => {
    const result = await run(CREATE, viewer, {
      input: validInput({ sourcingChapterId }),
    });
    expect(errorCode(result)).toBe("FORBIDDEN");
  });

  it("reports every invalid field", async () => {
    const result = await run(CREATE, LEAD, {
      input: validInput({
        title: "   ",
        clientContactEmail: "not-an-email",
        links: [{ label: "Repo", url: "javascript:alert(1)" }],
      }),
    });
    expect(errorCode(result)).toBe("BAD_USER_INPUT");
    expect(issuePaths(result)).toEqual(
      expect.arrayContaining(["title", "clientContactEmail", "links.0.url"])
    );
  });
});

describe("updateListing", () => {
  it("lets the sourcing chapter's leader edit and re-verifies the listing", async () => {
    const before = await create(LEAD);
    const result = await run(UPDATE, LEAD, {
      id: before.id,
      input: {
        title: "Renamed",
        techContext: "",
        links: [
          { label: "Repo", url: "https://github.com/x/y", linkType: "REPO" },
        ],
      },
    });
    expect(result.errors).toBeUndefined();
    const after = (result.data as { updateListing: Listing }).updateListing;

    expect(after.title).toBe("Renamed");
    expect(after.techContext).toBeNull();
    expect(after.description).toBe(before.description);
    expect(after.links).toEqual([
      { label: "Repo", url: "https://github.com/x/y", linkType: "REPO" },
    ]);
    expect(new Date(after.lastVerifiedAt).getTime()).toBeGreaterThan(
      new Date(before.lastVerifiedAt).getTime()
    );
  });

  it("keeps links when they are omitted", async () => {
    const before = await create(LEAD);
    const result = await run(UPDATE, LEAD, {
      id: before.id,
      input: { scope: "Smaller scope" },
    });
    expect(
      (result.data as { updateListing: Listing }).updateListing.links
    ).toEqual(before.links);
  });

  it("lets an admin edit any listing", async () => {
    const { id } = await create(LEAD);
    const result = await run(UPDATE, ADMIN, { id, input: { title: "Admin" } });
    expect(result.errors).toBeUndefined();
  });

  it.each([
    ["a leader of another chapter", OTHER_LEAD],
    ["a volunteer in the sourcing chapter", SAME_CHAPTER_VOLUNTEER],
  ])("forbids %s", async (_, viewer) => {
    const { id } = await create(LEAD);
    const result = await run(UPDATE, viewer, { id, input: { title: "Nope" } });
    expect(errorCode(result)).toBe("FORBIDDEN");
    const row = await db.sourcedProject.findUniqueOrThrow({ where: { id } });
    expect(row.title).not.toBe("Nope");
  });

  it("rejects clearing a required field", async () => {
    const { id } = await create(LEAD);
    const result = await run(UPDATE, LEAD, { id, input: { title: null } });
    expect(errorCode(result)).toBe("BAD_USER_INPUT");
    expect(issuePaths(result)).toEqual(["title"]);
  });

  it("returns NOT_FOUND for an unknown listing", async () => {
    const result = await run(UPDATE, ADMIN, {
      id: "no-such-listing",
      input: { title: "x" },
    });
    expect(errorCode(result)).toBe("NOT_FOUND");
  });
});

describe("withdrawListing", () => {
  it("forbids a leader of another chapter", async () => {
    const { id } = await create(LEAD);
    const result = await run(WITHDRAW, OTHER_LEAD, { id });
    expect(errorCode(result)).toBe("FORBIDDEN");
  });

  it("hides the listing and blocks further changes", async () => {
    const { id } = await create(LEAD);
    const withdrawn = await run(WITHDRAW, LEAD, { id });
    expect(withdrawn.errors).toBeUndefined();

    const fetched = await run(LISTING, LEAD, { id });
    expect((fetched.data as { listing: unknown }).listing).toBeNull();
    expect(errorCode(await run(WITHDRAW, LEAD, { id }))).toBe("NOT_FOUND");
    expect(
      errorCode(await run(UPDATE, LEAD, { id, input: { title: "x" } }))
    ).toBe("NOT_FOUND");
  });

  it("lets an admin withdraw any listing", async () => {
    const { id } = await create(LEAD);
    expect((await run(WITHDRAW, ADMIN, { id })).errors).toBeUndefined();
  });
});

describe("listings search and filters", () => {
  it("matches title, description, and scope case-insensitively", async () => {
    const token = `zq${randomUUID().slice(0, 8)}`;
    const inTitle = await create(LEAD, { title: `Title ${token}` });
    const inDescription = await create(LEAD, {
      description: `About ${token.toUpperCase()}`,
    });
    const inScope = await create(LEAD, { scope: `Scope ${token}` });
    await create(LEAD);

    const { nodes, totalCount } = await search(VOLUNTEER, { search: token });
    expect(nodes.map((n) => n.id).sort()).toEqual(
      [inTitle.id, inDescription.id, inScope.id].sort()
    );
    expect(totalCount).toBe(3);
  });

  it("combines search with filters", async () => {
    const token = `zq${randomUUID().slice(0, 8)}`;
    const health = await create(LEAD, {
      title: `Clinic ${token}`,
      causeArea: "HEALTH",
    });
    await create(LEAD, { title: `Garden ${token}`, causeArea: "ENVIRONMENT" });
    await create(ADMIN, {
      title: `Clinic ${token}`,
      causeArea: "HEALTH",
      sourcingChapterId: "seed-chapter-gt",
    });

    const { nodes } = await search(VOLUNTEER, {
      search: token,
      filter: { causeArea: "HEALTH", sourcingChapterId: LEAD.chapterId },
    });
    expect(nodes.map((n) => n.id)).toEqual([health.id]);
  });

  it("excludes withdrawn listings from search", async () => {
    const token = `zq${randomUUID().slice(0, 8)}`;
    const { id } = await create(LEAD, { title: token });
    await run(WITHDRAW, LEAD, { id });
    expect((await search(VOLUNTEER, { search: token })).totalCount).toBe(0);
  });

  it.each([
    ["status", { status: "AVAILABLE" }, (n: SearchNode) => n.status],
    ["cause area", { causeArea: "EDUCATION" }, (n: SearchNode) => n.causeArea],
    [
      "chapter",
      { sourcingChapterId: "seed-chapter-bu" },
      (n: SearchNode) => n.sourcingChapter.id,
    ],
  ])("filters by %s", async (_, filter, pick) => {
    const { nodes } = await search(VOLUNTEER, { filter });
    const [expected] = Object.values(filter);
    expect(nodes.length).toBeGreaterThan(0);
    for (const node of nodes) expect(pick(node)).toBe(expected);
  });

  it("treats a blank search as no search", async () => {
    const all = await search(VOLUNTEER, {});
    const blank = await search(VOLUNTEER, { search: "   " });
    expect(blank.totalCount).toBe(all.totalCount);
  });

  it("rejects an overly long search", async () => {
    const result = await run(SEARCH, VOLUNTEER, { search: "a".repeat(201) });
    expect(errorCode(result)).toBe("BAD_USER_INPUT");
  });
});
