import type { CauseArea, LinkType, SourcedProjectStatus } from "@prisma/client";

export const CAUSE_AREA_LABELS: Record<CauseArea, string> = {
  HEALTH: "Health",
  EDUCATION: "Education",
  FOOD_SECURITY: "Food security",
  HOUSING: "Housing",
  ENVIRONMENT: "Environment",
  ECONOMIC_OPPORTUNITY: "Economic opportunity",
  ARTS_AND_CULTURE: "Arts & culture",
  CIVIC_ENGAGEMENT: "Civic engagement",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<SourcedProjectStatus, string> = {
  AVAILABLE: "Available",
  CLAIM_PENDING: "Claim pending",
  CLAIMED: "Claimed",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const LINK_TYPE_LABELS: Record<LinkType, string> = {
  REPO: "Repository",
  SCOPING_DOC: "Scoping doc",
  DESIGN_FILE: "Design file",
  DELIVERABLE: "Deliverable",
  OTHER: "Other",
};

// Fixed locale and time zone so server and client render the same string.
const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
