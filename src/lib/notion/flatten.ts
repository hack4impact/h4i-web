/* eslint-disable @typescript-eslint/no-explicit-any */

function extractValue(prop: any): string | null {
  if (!prop) return null;
  switch (prop.type) {
    case "title":
    case "rich_text":
      return prop[prop.type]?.[0]?.plain_text || null;
    case "select":
      return prop.select?.name || null;
    case "multi_select":
      return (
        prop.multi_select
          ?.map((i: any) => i.name)
          .filter(Boolean)
          .join(", ") || null
      );
    case "number":
      return prop.number != null ? String(prop.number) : null;
    case "email":
      return prop.email || null;
    case "phone_number":
      return prop.phone_number || null;
    case "url": {
      const url = prop.url?.trim();
      if (!url) return null;
      return url.split(",")[0].trim() || null;
    }
    case "date":
      return prop.date?.start || null;
    case "checkbox":
      return prop.checkbox ? "Yes" : "No";
    case "place": {
      const address: string | undefined = prop.place?.address;
      if (!address) return null;
      const parts = address.split(",").map((s: string) => s.trim());
      for (let i = 1; i < parts.length - 1; i++) {
        const match = parts[i].match(/^([A-Z]{2})\b/);
        if (match) return `${parts[i - 1]}, ${match[1]}`;
      }
      return address;
    }
    default:
      return null;
  }
}

export function flattenNotionPage(page: any): Record<string, string> {
  const result: Record<string, string> = { id: page.id };
  for (const [name, prop] of Object.entries(
    page.properties as Record<string, any>
  )) {
    const value = extractValue(prop);
    if (value !== null) result[name] = value;
  }
  return result;
}
