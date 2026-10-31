/**
 * Escape `\`, `%`, and `_` so user-supplied keywords are treated as literals
 * under PostgreSQL ILIKE when used with `ESCAPE E'\\'`.
 */
export function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Wrap an escaped fragment as a case-insensitive substring pattern. */
export function ilikeContainsPattern(value: string): string {
  return `%${escapeIlikePattern(value)}%`;
}
