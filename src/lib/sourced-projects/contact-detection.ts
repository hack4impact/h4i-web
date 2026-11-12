// Spots contact details typed into a listing's public fields. Every member can
// read those fields, so client emails and phone numbers belong in the gated
// contact fields instead. Used for a warning only; it never blocks a save.

export type ContactInfoKind = "email" | "phone";

const PATTERNS: Record<ContactInfoKind, RegExp> = {
  email: /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/i,
  // US-style numbers: 555-123-4567, (555) 123 4567, +1 555.123.4567.
  phone: /(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\b\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/,
};

export function findContactInfo(text: string | null | undefined) {
  if (!text) return [];
  return (Object.keys(PATTERNS) as ContactInfoKind[]).filter((kind) =>
    PATTERNS[kind].test(text)
  );
}
