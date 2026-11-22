export function projectUrl(
  value: string | null | undefined,
  local = false
): string | null {
  if (!value) return null;
  if (local && /^\/(?!\/)[^\\\s]*$/.test(value)) return value;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol) ? value : null;
  } catch {
    return null;
  }
}
