/**
 * Canonical directory organizational positions (DirectoryPosition enum) and
 * unambiguous label → enum mappings for alumni Hack involvement history.
 *
 * Administrative Role values (COD, NATIONALS, CHAPTER_LEAD, PROJECT_LEAD,
 * VOLUNTEER) are intentionally NOT mapped here — they are permission roles,
 * not directory positions.
 *
 * Ambiguous or chapter-leadership labels (e.g. "Chapter Lead", "Officer") are
 * left unmapped so historical roleLabel text is preserved without guessing.
 */

export const DIRECTORY_POSITIONS = [
  "PM",
  "TL",
  "DEVELOPER",
  "DESIGNER",
  "BUSINESS",
] as const;

export type DirectoryPositionName = (typeof DIRECTORY_POSITIONS)[number];

/** PRD label → DirectoryPosition (normalized SCREAMING_SNAKE). */
export const PRD_POSITION_LABELS: Record<string, DirectoryPositionName> = {
  PM: "PM",
  TL: "TL",
  DEVELOPER: "DEVELOPER",
  DESIGNER: "DESIGNER",
  Business: "BUSINESS",
};

/**
 * Unambiguous raw involvement labels → DirectoryPosition.
 * Keys are compared case-insensitively after trim; only exact known synonyms.
 */
const UNAMBIGUOUS_INVOLVEMENT_LABELS: Record<string, DirectoryPositionName> = {
  pm: "PM",
  "project manager": "PM",
  "product manager": "PM",
  tl: "TL",
  "tech lead": "TL",
  "technical lead": "TL",
  developer: "DEVELOPER",
  dev: "DEVELOPER",
  engineer: "DEVELOPER",
  designer: "DESIGNER",
  design: "DESIGNER",
  business: "BUSINESS",
};

/**
 * Returns a canonical DirectoryPosition when the label maps unambiguously;
 * otherwise null (keep roleLabel as the source of truth).
 */
export function mapInvolvementLabelToPosition(
  roleLabel: string | null | undefined
): DirectoryPositionName | null {
  if (!roleLabel) return null;
  const key = roleLabel.trim().toLowerCase();
  if (!key) return null;
  return UNAMBIGUOUS_INVOLVEMENT_LABELS[key] ?? null;
}
