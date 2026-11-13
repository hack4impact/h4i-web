import { EventEmitter } from "node:events";

export type ClaimRequestedEvent = {
  claimId: string;
  listingId: string;
  listingTitle: string;
  sourcingChapterId: string;
  claimingChapterId: string;
  requestedById: string;
};

type ClaimEventMap = {
  claimRequested: [ClaimRequestedEvent];
};

// In-process events for claim activity. Notifications subscribe here so the
// claim service doesn't need to know how the sourcing chapter is told.
export const claimEvents = new EventEmitter<ClaimEventMap>();

// Emitted after the claim is committed. A failing listener is logged rather
// than thrown, so it can't fail a claim that has already been saved.
export function emitClaimRequested(event: ClaimRequestedEvent) {
  try {
    claimEvents.emit("claimRequested", event);
  } catch (error) {
    console.error("claimRequested listener failed", error);
  }
}
