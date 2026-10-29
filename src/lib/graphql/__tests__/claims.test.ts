// Runs against the seeded dev database (`pnpm prisma db seed`). Each test makes
// its own listings, which are deleted again in afterAll.
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  claimEvents,
  type ClaimRequestedEvent,
} from "@/lib/sourced-projects/claim-events";
import {
  CLAIM_TIMEOUT_DAYS,
  expireStaleClaims,
} from "@/lib/sourced-projects/claims";
import type { Viewer } from "@/lib/sourced-projects/contact-gating";
import { ADMIN, LEAD, run, VOLUNTEER, type GraphQLResult } from "./helpers";

// LEAD (Berkeley) sources every listing here; these leaders claim them.
const UIUC_LEAD: Viewer = {
  id: "seed-user-lead-uiuc",
  role: "CHAPTER_LEADER",
  chapterId: "seed-chapter-uiuc",
};
const GT_LEAD: Viewer = {
  id: "seed-user-lead-gt",
  role: "CHAPTER_LEADER",
  chapterId: "seed-chapter-gt",
};

const CLAIM_FIELDS = /* GraphQL */ `
  id
  status
  message
  resolvedAt
  claimingChapter { id }
  listing { id status }
`;

const REQUEST = /* GraphQL */ `
  mutation ($listingId: ID!, $message: String) {
    requestClaim(listingId: $listingId, message: $message) { ${CLAIM_FIELDS} }
  }
`;

const resolveMutation = (name: string) => /* GraphQL */ `
  mutation ($id: ID!) {
    ${name}(id: $id) { ${CLAIM_FIELDS} }
  }
`;
const APPROVE = resolveMutation("approveClaim");
const REJECT = resolveMutation("rejectClaim");
const WITHDRAW = resolveMutation("withdrawClaim");
const ABANDON = resolveMutation("abandonClaim");

const WITHDRAW_LISTING = /* GraphQL */ `
  mutation ($id: ID!) {
    withdrawListing(id: $id) {
      id
    }
  }
`;

const LISTING = /* GraphQL */ `
  query ($id: ID!) {
    listing(id: $id) {
      status
      activeClaim {
        id
        status
        claimingChapter {
          id
        }
      }
    }
  }
`;

type Claim = {
  id: string;
  status: string;
  message: string | null;
  resolvedAt: string | null;
  claimingChapter: { id: string };
  listing: { id: string; status: string } | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const createdListingIds: string[] = [];

async function newListing() {
  const listing = await db.sourcedProject.create({
    data: {
      title: "Claim test listing",
      description: "Created by claims.test.ts",
      scope: "Test",
      causeArea: "OTHER",
      handoffNotes: "Test",
      sourcingChapterId: LEAD.chapterId!,
      sourcedById: LEAD.id,
      clientOrgName: "Test Org",
      clientContactName: "Test Contact",
      clientContactEmail: "test@example.org",
    },
  });
  createdListingIds.push(listing.id);
  return listing.id;
}

const errorCode = (result: GraphQLResult) =>
  result.errors?.[0]?.extensions.code;

function dataOf(result: GraphQLResult, field: string): Claim {
  expect(result.errors).toBeUndefined();
  return (result.data as Record<string, Claim>)[field];
}

async function request(viewer: Viewer, listingId: string, message?: string) {
  return dataOf(
    await run(REQUEST, viewer, { listingId, message }),
    "requestClaim"
  );
}

async function listingStatus(id: string) {
  const row = await db.sourcedProject.findUniqueOrThrow({ where: { id } });
  return row.status;
}

// Written directly so the expiry tests can backdate requestedAt.
async function pendingClaim(listingId: string, requestedAt: Date) {
  await db.sourcedProject.update({
    where: { id: listingId },
    data: { status: "CLAIM_PENDING" },
  });
  return db.projectClaim.create({
    data: {
      sourcedProjectId: listingId,
      claimingChapterId: UIUC_LEAD.chapterId!,
      requestedById: UIUC_LEAD.id,
      requestedAt,
    },
  });
}

afterAll(async () => {
  await db.projectClaim.deleteMany({
    where: { sourcedProjectId: { in: createdListingIds } },
  });
  await db.sourcedProject.deleteMany({
    where: { id: { in: createdListingIds } },
  });
  await db.$disconnect();
});

describe("requestClaim", () => {
  it("creates a pending claim and moves the listing to CLAIM_PENDING", async () => {
    const listingId = await newListing();
    const claim = await request(UIUC_LEAD, listingId, "  We can start now. ");

    expect(claim).toMatchObject({
      status: "PENDING",
      message: "We can start now.",
      claimingChapter: { id: UIUC_LEAD.chapterId },
      listing: { id: listingId, status: "CLAIM_PENDING" },
    });
  });

  it("emits a claimRequested event", async () => {
    const listingId = await newListing();
    const events: ClaimRequestedEvent[] = [];
    const listener = (event: ClaimRequestedEvent) => events.push(event);
    claimEvents.on("claimRequested", listener);
    try {
      const claim = await request(UIUC_LEAD, listingId);
      expect(events).toEqual([
        {
          claimId: claim.id,
          listingId,
          listingTitle: "Claim test listing",
          sourcingChapterId: LEAD.chapterId,
          claimingChapterId: UIUC_LEAD.chapterId,
          requestedById: UIUC_LEAD.id,
        },
      ]);
    } finally {
      claimEvents.off("claimRequested", listener);
    }
  });

  it("still saves the claim when a listener throws", async () => {
    const listingId = await newListing();
    const listener = () => {
      throw new Error("notification failed");
    };
    claimEvents.on("claimRequested", listener);
    try {
      expect((await request(UIUC_LEAD, listingId)).status).toBe("PENDING");
    } finally {
      claimEvents.off("claimRequested", listener);
    }
  });

  it.each([
    ["a volunteer", VOLUNTEER],
    ["an admin", ADMIN],
    ["the sourcing chapter", LEAD],
  ])("forbids %s", async (_, viewer) => {
    const listingId = await newListing();
    const result = await run(REQUEST, viewer, { listingId });
    expect(errorCode(result)).toBe("FORBIDDEN");
    expect(await listingStatus(listingId)).toBe("AVAILABLE");
  });

  it("rejects a listing that already has a claim", async () => {
    const listingId = await newListing();
    await request(UIUC_LEAD, listingId);
    const result = await run(REQUEST, GT_LEAD, { listingId });
    expect(errorCode(result)).toBe("CONFLICT");
  });

  it("returns NOT_FOUND for a withdrawn listing", async () => {
    const listingId = await newListing();
    await run(WITHDRAW_LISTING, LEAD, { id: listingId });
    const result = await run(REQUEST, UIUC_LEAD, { listingId });
    expect(errorCode(result)).toBe("NOT_FOUND");
  });

  it("rejects an overly long message", async () => {
    const listingId = await newListing();
    const result = await run(REQUEST, UIUC_LEAD, {
      listingId,
      message: "a".repeat(1001),
    });
    expect(errorCode(result)).toBe("BAD_USER_INPUT");
  });

  it("lets only one of two simultaneous claims through", async () => {
    // Repeated because a race that is only sometimes lost would pass once.
    for (let i = 0; i < 5; i++) {
      const listingId = await newListing();
      const results = await Promise.all([
        run(REQUEST, UIUC_LEAD, { listingId }),
        run(REQUEST, GT_LEAD, { listingId }),
      ]);

      expect(results.filter((r) => !r.errors)).toHaveLength(1);
      expect(results.map(errorCode).filter(Boolean)).toEqual(["CONFLICT"]);
      expect(
        await db.projectClaim.count({ where: { sourcedProjectId: listingId } })
      ).toBe(1);
      expect(await listingStatus(listingId)).toBe("CLAIM_PENDING");
    }
  });
});

describe("resolving claims", () => {
  async function pending() {
    const listingId = await newListing();
    const claim = await request(UIUC_LEAD, listingId);
    return { listingId, claimId: claim.id };
  }

  async function approved() {
    const ids = await pending();
    dataOf(await run(APPROVE, LEAD, { id: ids.claimId }), "approveClaim");
    return ids;
  }

  it("approve moves the claim to APPROVED and the listing to CLAIMED", async () => {
    const { claimId, listingId } = await pending();
    const claim = dataOf(
      await run(APPROVE, LEAD, { id: claimId }),
      "approveClaim"
    );

    expect(claim.status).toBe("APPROVED");
    expect(claim.resolvedAt).not.toBeNull();
    expect(claim.listing?.status).toBe("CLAIMED");
    const row = await db.projectClaim.findUniqueOrThrow({
      where: { id: claimId },
    });
    expect(row.resolvedById).toBe(LEAD.id);

    const listing = await run(LISTING, VOLUNTEER, { id: listingId });
    expect(
      (listing.data as { listing: { activeClaim: unknown } }).listing
        .activeClaim
    ).toMatchObject({ id: claimId, status: "APPROVED" });
  });

  it("lets an admin approve", async () => {
    const { claimId } = await pending();
    expect((await run(APPROVE, ADMIN, { id: claimId })).errors).toBeUndefined();
  });

  it.each([
    ["the claiming chapter", UIUC_LEAD],
    ["an unrelated chapter", GT_LEAD],
    ["a volunteer", VOLUNTEER],
  ])("forbids %s from approving or rejecting", async (_, viewer) => {
    const { claimId, listingId } = await pending();
    expect(errorCode(await run(APPROVE, viewer, { id: claimId }))).toBe(
      "FORBIDDEN"
    );
    expect(errorCode(await run(REJECT, viewer, { id: claimId }))).toBe(
      "FORBIDDEN"
    );
    expect(await listingStatus(listingId)).toBe("CLAIM_PENDING");
  });

  it("reject returns the listing to AVAILABLE so another chapter can claim", async () => {
    const { claimId, listingId } = await pending();
    const claim = dataOf(
      await run(REJECT, LEAD, { id: claimId }),
      "rejectClaim"
    );

    expect(claim.status).toBe("REJECTED");
    expect(claim.listing?.status).toBe("AVAILABLE");
    expect((await request(GT_LEAD, listingId)).status).toBe("PENDING");
  });

  it("withdraw lets the claiming chapter back out", async () => {
    const { claimId, listingId } = await pending();
    expect(errorCode(await run(WITHDRAW, GT_LEAD, { id: claimId }))).toBe(
      "FORBIDDEN"
    );
    expect(errorCode(await run(WITHDRAW, LEAD, { id: claimId }))).toBe(
      "FORBIDDEN"
    );

    const claim = dataOf(
      await run(WITHDRAW, UIUC_LEAD, { id: claimId }),
      "withdrawClaim"
    );
    expect(claim.status).toBe("WITHDRAWN");
    expect(await listingStatus(listingId)).toBe("AVAILABLE");
  });

  it.each([
    ["the claiming chapter", UIUC_LEAD],
    ["the sourcing chapter", LEAD],
  ])("abandon by %s returns the listing to AVAILABLE", async (_, viewer) => {
    const { claimId, listingId } = await approved();
    const claim = dataOf(
      await run(ABANDON, viewer, { id: claimId }),
      "abandonClaim"
    );

    expect(claim.status).toBe("ABANDONED");
    expect(await listingStatus(listingId)).toBe("AVAILABLE");
  });

  it("forbids an unrelated chapter from abandoning", async () => {
    const { claimId } = await approved();
    expect(errorCode(await run(ABANDON, GT_LEAD, { id: claimId }))).toBe(
      "FORBIDDEN"
    );
  });

  it.each([
    ["approve an approved claim", APPROVE, LEAD, approved],
    ["reject an approved claim", REJECT, LEAD, approved],
    ["withdraw an approved claim", WITHDRAW, UIUC_LEAD, approved],
    ["abandon a pending claim", ABANDON, UIUC_LEAD, pending],
  ])("refuses to %s", async (_, mutation, viewer, setup) => {
    const { claimId, listingId } = await setup();
    const before = await listingStatus(listingId);
    expect(errorCode(await run(mutation, viewer, { id: claimId }))).toBe(
      "CONFLICT"
    );
    expect(await listingStatus(listingId)).toBe(before);
  });

  it("lets only one of two simultaneous decisions through", async () => {
    const { claimId } = await pending();
    const results = await Promise.all([
      run(APPROVE, LEAD, { id: claimId }),
      run(REJECT, ADMIN, { id: claimId }),
    ]);
    expect(results.map(errorCode).filter(Boolean)).toEqual(["CONFLICT"]);
  });

  it("returns NOT_FOUND for an unknown claim", async () => {
    expect(errorCode(await run(APPROVE, ADMIN, { id: "no-such-claim" }))).toBe(
      "NOT_FOUND"
    );
  });
});

describe("claim timeout", () => {
  // Far in the past so no seeded claim is old enough to be swept up.
  const now = new Date("2000-01-01T00:00:00Z");
  const stale = new Date(now.getTime() - (CLAIM_TIMEOUT_DAYS + 1) * DAY_MS);
  const fresh = new Date(now.getTime() - (CLAIM_TIMEOUT_DAYS - 1) * DAY_MS);

  it("expires stale pending claims and leaves fresh ones", async () => {
    const staleListing = await newListing();
    const freshListing = await newListing();
    const staleClaim = await pendingClaim(staleListing, stale);
    const freshClaim = await pendingClaim(freshListing, fresh);

    expect(await expireStaleClaims({ now })).toBe(1);

    const rows = await db.projectClaim.findMany({
      where: { id: { in: [staleClaim.id, freshClaim.id] } },
    });
    expect(Object.fromEntries(rows.map((r) => [r.id, r.status]))).toEqual({
      [staleClaim.id]: "EXPIRED",
      [freshClaim.id]: "PENDING",
    });
    expect(await listingStatus(staleListing)).toBe("AVAILABLE");
    expect(await listingStatus(freshListing)).toBe("CLAIM_PENDING");
  });

  it("expires a stale claim when another chapter requests the listing", async () => {
    const listingId = await newListing();
    const old = await pendingClaim(
      listingId,
      new Date(Date.now() - (CLAIM_TIMEOUT_DAYS + 1) * DAY_MS)
    );

    expect((await request(GT_LEAD, listingId)).status).toBe("PENDING");
    const row = await db.projectClaim.findUniqueOrThrow({
      where: { id: old.id },
    });
    expect(row.status).toBe("EXPIRED");
  });
});

describe("withdrawListing with claims", () => {
  it("rejects a pending claim along with the listing", async () => {
    const listingId = await newListing();
    const claim = await request(UIUC_LEAD, listingId);

    expect(
      (await run(WITHDRAW_LISTING, LEAD, { id: listingId })).errors
    ).toBeUndefined();
    const row = await db.projectClaim.findUniqueOrThrow({
      where: { id: claim.id },
    });
    expect(row.status).toBe("REJECTED");
  });

  it("refuses while a claim is approved", async () => {
    const listingId = await newListing();
    const claim = await request(UIUC_LEAD, listingId);
    await run(APPROVE, LEAD, { id: claim.id });

    const result = await run(WITHDRAW_LISTING, LEAD, { id: listingId });
    expect(errorCode(result)).toBe("CONFLICT");
    const listing = await db.sourcedProject.findUniqueOrThrow({
      where: { id: listingId },
    });
    expect(listing.withdrawnAt).toBeNull();
    expect(listing.status).toBe("CLAIMED");
  });
});
