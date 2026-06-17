/* eslint-disable @typescript-eslint/no-explicit-any */

const COUNTRY_CODES: Record<string, string> = {
  Lebanon: 'LB',
}

export function normalizeLocation(place: string): string {
  const parts = place.split(', ')
  const last = parts[parts.length - 1]
  if (parts.length >= 2 && COUNTRY_CODES[last]) {
    parts[parts.length - 1] = COUNTRY_CODES[last]
  }
  return parts.join(', ')
}

export function stripOrgPrefix(name: string): string {
  return name
    .replace(/^Hack4Impact\s*/i, '')
    .replace(/^Hack\s*for\s*Impact\s*/i, '')
}

export function toSlug(name: string): string {
  return stripOrgPrefix(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export const NotionUtils = {
  getText: (prop: any) =>
    prop?.title?.[0]?.plain_text || prop?.rich_text?.[0]?.plain_text || '',

  getSelect: (prop: any) => prop?.select?.name || null,

  getMultiSelect: (prop: any) =>
    prop?.multi_select?.map((item: any) => item.name) || [],

  getUrl: (prop: any) => {
    const url = prop?.url?.trim()
    if (!url) return null
    // Some fields contain multiple URLs separated by commas — take the first
    let first = url.split(',')[0].trim()
    if (!first) return null
    // Ensure protocol is present so links don't resolve as relative paths
    if (!/^https?:\/\//i.test(first)) {
      first = `https://${first}`
    }
    return first
  },

  getEmail: (prop: any) => prop?.email || null,

  getPhone: (prop: any) => prop?.phone_number || null,

  getNumber: (prop: any) => prop?.number || null,

  getRelation: (prop: any) => prop?.relation?.map((item: any) => item.id) || [],

  getFile: (prop: any) => {
    const file = prop?.files?.[0]
    return file?.file?.url || file?.external?.url || null
  },

  getPlace: (prop: any) => {
    const address: string | undefined = prop?.place?.address
    if (!address) return null
    // Parse "City, ST ZIP" from address like "Name, Street, City, ST ZIP, Country"
    const parts = address.split(',').map((s: string) => s.trim())
    // Find the part with a state/province code + optional zip (e.g. "MA 02215-1714" or "QC")
    for (let i = 1; i < parts.length - 1; i++) {
      const match = parts[i].match(/^([A-Z]{2})\b/)
      if (match && i > 0) {
        return `${parts[i - 1]}, ${match[1]}`
      }
    }
    return address
  },
}
