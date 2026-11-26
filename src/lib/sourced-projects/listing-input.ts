import { CauseArea, LinkType } from "@prisma/client";
import { z } from "zod";

export const MAX_LINKS = 20;
export const MAX_SEARCH_LENGTH = 200;

const text = (max: number) => z.string().trim().min(1, "Required").max(max);

// Blank strings are stored as null so "cleared" has a single representation.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => value || null);

const linkInput = z.object({
  label: text(120),
  url: z
    .string()
    .trim()
    .pipe(z.url({ protocol: /^https?$/, error: "Must be an http(s) URL" })),
  linkType: z.enum(LinkType).default("OTHER"),
});

const listingFields = z.object({
  title: text(200),
  description: text(5000),
  scope: text(5000),
  causeArea: z.enum(CauseArea),
  techContext: optionalText(2000).optional(),
  handoffNotes: text(5000),
  clientOrgName: text(200),
  clientContactName: text(200),
  clientContactEmail: z.string().trim().pipe(z.email()),
  clientContactPhone: optionalText(50).optional(),
  partnerNotes: optionalText(5000).optional(),
  links: z.array(linkInput).max(MAX_LINKS).optional(),
});

export const createListingInput = listingFields.extend({
  sourcingChapterId: z.string().min(1).nullish(),
});

// Omitted fields are left unchanged; `links`, when present, replaces the set.
export const updateListingInput = listingFields.partial();

export type CreateListingInput = z.infer<typeof createListingInput>;
export type UpdateListingInput = z.infer<typeof updateListingInput>;
