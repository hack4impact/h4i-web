/* eslint-disable @typescript-eslint/no-explicit-any */

export function stripOrgPrefix(name: string): string {
  return name
    .replace(/^Hack4Impact\s*/i, "")
    .replace(/^Hack\s*for\s*Impact\s*/i, "");
}

export const NotionUtils = {
  getText: (prop: any) =>
    prop?.title?.[0]?.plain_text || prop?.rich_text?.[0]?.plain_text || "",

  getSelect: (prop: any) => prop?.select?.name || null,

  getMultiSelect: (prop: any) =>
    prop?.multi_select?.map((item: any) => item.name) || [],

  getUrl: (prop: any) => {
    const url = prop?.url?.trim();
    if (!url) return null;
    let first = url.split(",")[0].trim();
    if (!first) return null;
    if (!/^https?:\/\//i.test(first)) {
      first = `https://${first}`;
    }
    return first;
  },

  getEmail: (prop: any) => prop?.email || null,

  getPhone: (prop: any) => prop?.phone_number || null,

  getNumber: (prop: any) => prop?.number ?? null,

  getRelation: (prop: any) => prop?.relation?.map((item: any) => item.id) || [],

  getFile: (prop: any) => {
    const file = prop?.files?.[0];
    return file?.file?.url || file?.external?.url || null;
  },

  getPlace: (prop: any) => {
    const address: string | undefined = prop?.place?.address;
    if (!address) return null;
    const parts = address.split(",").map((s: string) => s.trim());
    for (let i = 1; i < parts.length - 1; i++) {
      const match = parts[i].match(/^([A-Z]{2})\b/);
      if (match) {
        return `${parts[i - 1]}, ${match[1]}`;
      }
    }
    return address;
  },
};
