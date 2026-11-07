import { z } from "zod";

/**
 * Validation bounds for directory Member / Alumni profile fields.
 * Schema-only Week 1 — no forms or APIs wired here yet.
 *
 * Private account email/phone stay on User / import pipelines — not here.
 * contactEmail and *Url fields are deliberately shared directory contacts.
 */

const currentYear = new Date().getFullYear();

export const directoryPositionSchema = z.enum([
  "PM",
  "TL",
  "DEVELOPER",
  "DESIGNER",
  "BUSINESS",
]);

export const directoryApprovalStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

/** Reasonable undergrad/grad window around Hack for Impact history. */
export const graduationYearSchema = z
  .number()
  .int()
  .min(1990)
  .max(currentYear + 8);

const nonEmptyTrimmed = (max: number) =>
  z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message: "Must not be empty" })
    .refine((value) => value.length <= max, {
      message: `Must be at most ${max} characters`,
    });

export const shortTextSchema = nonEmptyTrimmed(200);
export const majorSchema = nonEmptyTrimmed(120);
export const locationSchema = nonEmptyTrimmed(120);
export const bioSchema = nonEmptyTrimmed(2000);

/** Dedupes case-insensitively while preserving first-seen casing; drops empties. */
export function normalizeTagList(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > 60) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export const tagListSchema = z
  .array(z.string())
  .max(30)
  .transform(normalizeTagList)
  .refine((tags) => tags.every((t) => t.length >= 1 && t.length <= 60), {
    message: "Each tag must be 1–60 characters after trim",
  });

export const contactEmailSchema = z.email().max(254);

const SAFE_URL_SCHEMES = new Set(["http:", "https:"]);

/** http(s) only — rejects javascript:, data:, file:, etc. */
export const safeHttpUrlSchema = z
  .string()
  .max(500)
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, { message: "URL must not be empty" })
  .refine(
    (value) => {
      try {
        const parsed = new URL(value);
        return SAFE_URL_SCHEMES.has(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: "URL must use http or https" }
  );

export const directoryProfileFieldsSchema = z.object({
  displayName: shortTextSchema.optional(),
  contactEmail: contactEmailSchema.optional(),
  linkedInUrl: safeHttpUrlSchema.optional(),
  githubUrl: safeHttpUrlSchema.optional(),
  websiteUrl: safeHttpUrlSchema.optional(),
  instagramUrl: safeHttpUrlSchema.optional(),
  graduationYear: graduationYearSchema.optional(),
  major: majorSchema.optional(),
  location: locationSchema.optional(),
  skills: tagListSchema.optional(),
  interests: tagListSchema.optional(),
  bio: bioSchema.optional(),
  position: directoryPositionSchema.optional(),
  chapterId: z.string().cuid().optional(),
  // Opt-in is explicit; owning/claiming must not imply true.
  directoryOptIn: z.boolean().optional(),
});

export type DirectoryProfileFields = z.infer<
  typeof directoryProfileFieldsSchema
>;
