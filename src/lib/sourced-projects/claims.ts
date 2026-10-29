import {
  Prisma,
  type ClaimStatus,
  type SourcedProjectStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import { emitClaimRequested } from "@/lib/sourced-projects/claim-events";
import type { Viewer } from "@/lib/sourced-projects/contact-gating";
import { canManageListing } from "@/lib/sourced-projects/permissions";

// A pending claim the sourcing chapter hasn't answered in this long expires and
// the listing goes back to AVAILABLE.
export const CLAIM_TIMEOUT_DAYS = 14;
export const MAX_CLAIM_MESSAGE_LENGTH = 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

export const ACTIVE_CLAIM_STATUSES = [
  "PENDING",
  "APPROVED",
] as const satisfies ClaimStatus[];

export const claimSelect = {
  id: true,
  status: true,
  message: true,
  requestedAt: true,
  resolvedAt: true,
  sourcedProjectId: true,
  claimingChapter: { select: { id: true, name: true, region: true } },
} satisfies Prisma.ProjectClaimSelect;

export type ClaimErrorCode =
  | "BAD_USER_INPUT"
  | "CONFLICT"
  | "FORBIDDEN"
  | "NOT_FOUND";

export class ClaimError extends Error {
  constructor(
    readonly code: ClaimErrorCode,
    message: string
  ) {
    super(message);
  }
}

// Every claim status change and the listing status that goes with it. This
// module is the only code that writes either, so the two can't drift apart.
const TRANSITIONS = {
  approve: { from: "PENDING", to: "APPROVED", listing: "CLAIMED" },
  reject: { from: "PENDING", to: "REJECTED", listing: "AVAILABLE" },
  withdraw: { from: "PENDING", to: "WITHDRAWN", listing: "AVAILABLE" },
  expire: { from: "PENDING", to: "EXPIRED", listing: "AVAILABLE" },
  abandon: { from: "APPROVED", to: "ABANDONED", listing: "AVAILABLE" },
} as const satisfies Record<
  string,
  { from: ClaimStatus; to: ClaimStatus; listing: SourcedProjectStatus }
>;

type Transition = keyof typeof TRANSITIONS;
export type ClaimAction = Exclude<Transition, "expire">;

type ClaimParties = { sourcingChapterId: string; claimingChapterId: string };

const isClaimant = (viewer: Viewer, claim: ClaimParties) =>
  viewer.role === "ADMIN" ||
  (viewer.role === "CHAPTER_LEADER" &&
    viewer.chapterId === claim.claimingChapterId);

const isSourcer = (viewer: Viewer, claim: ClaimParties) =>
  canManageListing(viewer, claim.sourcingChapterId);

// Either side can abandon an approved claim: the claiming chapter when it can't
// finish, the sourcing chapter when the claimant has gone quiet.
const PERMITTED: Record<
  ClaimAction,
  (viewer: Viewer, claim: ClaimParties) => boolean
> = {
  approve: isSourcer,
  reject: isSourcer,
  withdraw: isClaimant,
  abandon: (viewer, claim) =>
    isClaimant(viewer, claim) || isSourcer(viewer, claim),
};

// Moves a claim only if it is still in the expected status, so two racing
// transitions can't both apply. Returns false when the claim had already moved.
async function tryTransition(
  tx: Prisma.TransactionClient,
  claim: { id: string; sourcedProjectId: string },
  transition: Transition,
  resolvedById: string | null,
  now = new Date()
) {
  const { from, to, listing } = TRANSITIONS[transition];
  const { count } = await tx.projectClaim.updateMany({
    where: { id: claim.id, status: from },
    data: { status: to, resolvedAt: now, resolvedById },
  });
  if (count === 0) return false;
  await tx.sourcedProject.update({
    where: { id: claim.sourcedProjectId },
    data: { status: listing },
  });
  return true;
}

export async function requestClaim(
  viewer: Viewer,
  listingId: string,
  rawMessage?: string | null
) {
  if (viewer.role !== "CHAPTER_LEADER" || !viewer.chapterId) {
    throw new ClaimError(
      "FORBIDDEN",
      "Only chapter leaders can claim listings"
    );
  }
  const claimingChapterId = viewer.chapterId;
  const message = rawMessage?.trim() || null;
  if (message && message.length > MAX_CLAIM_MESSAGE_LENGTH) {
    throw new ClaimError(
      "BAD_USER_INPUT",
      `Message must be at most ${MAX_CLAIM_MESSAGE_LENGTH} characters`
    );
  }

  let result;
  try {
    result = await db.$transaction(async (tx) => {
      const listing = await tx.sourcedProject.findFirst({
        where: { id: listingId, withdrawnAt: null },
        select: { title: true, sourcingChapterId: true },
      });
      if (!listing) throw new ClaimError("NOT_FOUND", "Listing not found");
      if (listing.sourcingChapterId === claimingChapterId) {
        throw new ClaimError(
          "FORBIDDEN",
          "A chapter can't claim its own listing"
        );
      }

      // A stale pending claim shouldn't block a new one while waiting for the
      // scheduled expiry run.
      await expireStaleClaims({ listingId }, tx);

      // The conditional update takes the row lock. A concurrent request waits
      // for it, then re-checks the status, matches nothing, and is rejected.
      const { count } = await tx.sourcedProject.updateMany({
        where: { id: listingId, status: "AVAILABLE", withdrawnAt: null },
        data: { status: "CLAIM_PENDING" },
      });
      if (count === 0) {
        throw new ClaimError("CONFLICT", "Listing is not available to claim");
      }

      const claim = await tx.projectClaim.create({
        data: {
          sourcedProjectId: listingId,
          claimingChapterId,
          requestedById: viewer.id,
          message,
        },
        select: claimSelect,
      });
      return { claim, listing };
    });
  } catch (error) {
    // Backstop: the one-active-claim index rejects anything that got past the
    // status check.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ClaimError("CONFLICT", "Listing is not available to claim");
    }
    throw error;
  }

  emitClaimRequested({
    claimId: result.claim.id,
    listingId,
    listingTitle: result.listing.title,
    sourcingChapterId: result.listing.sourcingChapterId,
    claimingChapterId,
    requestedById: viewer.id,
  });
  return result.claim;
}

export async function resolveClaim(
  viewer: Viewer,
  claimId: string,
  action: ClaimAction
) {
  const claim = await db.projectClaim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      sourcedProjectId: true,
      claimingChapterId: true,
      sourcedProject: {
        select: { sourcingChapterId: true, withdrawnAt: true },
      },
    },
  });
  if (!claim || claim.sourcedProject.withdrawnAt) {
    throw new ClaimError("NOT_FOUND", "Claim not found");
  }

  const parties = {
    sourcingChapterId: claim.sourcedProject.sourcingChapterId,
    claimingChapterId: claim.claimingChapterId,
  };
  if (!PERMITTED[action](viewer, parties)) {
    throw new ClaimError(
      "FORBIDDEN",
      `You don't have permission to ${action} this claim`
    );
  }

  return db.$transaction(async (tx) => {
    if (!(await tryTransition(tx, claim, action, viewer.id))) {
      const { from } = TRANSITIONS[action];
      throw new ClaimError(
        "CONFLICT",
        `Only a ${from.toLowerCase()} claim can be ${TRANSITIONS[action].to.toLowerCase()}`
      );
    }
    return tx.projectClaim.findUniqueOrThrow({
      where: { id: claim.id },
      select: claimSelect,
    });
  });
}

// Expires pending claims older than CLAIM_TIMEOUT_DAYS. Runs on a schedule via
// `pnpm claims:expire`, and for a single listing before a new claim on it.
export async function expireStaleClaims(
  { listingId, now = new Date() }: { listingId?: string; now?: Date } = {},
  tx?: Prisma.TransactionClient
) {
  const cutoff = new Date(now.getTime() - CLAIM_TIMEOUT_DAYS * DAY_MS);
  const stale = await (tx ?? db).projectClaim.findMany({
    where: {
      status: "PENDING",
      requestedAt: { lt: cutoff },
      ...(listingId && { sourcedProjectId: listingId }),
    },
    select: { id: true, sourcedProjectId: true },
  });

  let expired = 0;
  for (const claim of stale) {
    const expire = (client: Prisma.TransactionClient) =>
      tryTransition(client, claim, "expire", null, now);
    if (await (tx ? expire(tx) : db.$transaction(expire))) expired++;
  }
  return expired;
}

// Runs inside the listing-withdrawal transaction. A pending claim is rejected
// along with the listing. An approved claim means a chapter is working on it,
// so it has to be abandoned first.
export async function closeClaimsForWithdrawal(
  tx: Prisma.TransactionClient,
  listingId: string,
  viewer: Viewer
) {
  const active = await tx.projectClaim.findFirst({
    where: {
      sourcedProjectId: listingId,
      status: { in: [...ACTIVE_CLAIM_STATUSES] },
    },
    select: { id: true, sourcedProjectId: true, status: true },
  });
  if (!active) return;
  if (
    active.status === "APPROVED" ||
    !(await tryTransition(tx, active, "reject", viewer.id))
  ) {
    throw new ClaimError(
      "CONFLICT",
      "This listing has an approved claim. Abandon the claim before withdrawing the listing."
    );
  }
}
