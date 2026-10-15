import type { Prisma } from "@prisma/client";
import type { AppRole } from "@/types";

export type Viewer = {
  id: string;
  role: AppRole;
  chapterId: string | null;
};

// Client contact details and partner notes on a SourcedProject. Only chapter
// leaders and admins may see them; for everyone else they are never selected
// from the database, so they can't leak through a resolver.
export const GATED_FIELDS = [
  "clientOrgName",
  "clientContactName",
  "clientContactEmail",
  "clientContactPhone",
  "partnerNotes",
] as const;

export function canViewContact(viewer: Viewer): boolean {
  return viewer.role === "ADMIN" || viewer.role === "CHAPTER_LEADER";
}

const publicListingSelect = {
  id: true,
  title: true,
  description: true,
  scope: true,
  causeArea: true,
  techContext: true,
  status: true,
  handoffNotes: true,
  postedAt: true,
  lastVerifiedAt: true,
  updatedAt: true,
  sourcingChapter: { select: { id: true, name: true, region: true } },
  links: {
    select: { id: true, label: true, url: true, linkType: true },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.SourcedProjectSelect;

const gatedListingSelect = Object.fromEntries(
  GATED_FIELDS.map((field) => [field, true])
) as Record<(typeof GATED_FIELDS)[number], true>;

export function listingSelect(viewer: Viewer) {
  return canViewContact(viewer)
    ? { ...publicListingSelect, ...gatedListingSelect }
    : publicListingSelect;
}

type SelectedListing = Prisma.SourcedProjectGetPayload<{
  select: typeof publicListingSelect & typeof gatedListingSelect;
}>;

export type ListingContact = Pick<
  SelectedListing,
  (typeof GATED_FIELDS)[number]
>;

export type ListingView = Prisma.SourcedProjectGetPayload<{
  select: typeof publicListingSelect;
}> & { contact: ListingContact | null };

// Shapes a row into the API view. Gated fields are moved under `contact`, which
// is null unless the viewer may see it, so even a row fetched with the full
// select is safe to return.
export function toListingView(
  row: Partial<ListingContact> & Omit<ListingView, "contact">,
  viewer: Viewer
): ListingView {
  const view: Record<string, unknown> = { ...row };
  for (const field of GATED_FIELDS) delete view[field];

  return {
    ...(view as Omit<ListingView, "contact">),
    contact: canViewContact(viewer)
      ? {
          clientOrgName: row.clientOrgName!,
          clientContactName: row.clientContactName!,
          clientContactEmail: row.clientContactEmail!,
          clientContactPhone: row.clientContactPhone ?? null,
          partnerNotes: row.partnerNotes ?? null,
        }
      : null,
  };
}
