import type { PartnerReference } from "./references";

export function partnerFromNotion(value: unknown): PartnerReference | null {
  if (!value || typeof value !== "object") return null;
  const page = value as Record<string, unknown>;
  if (
    typeof page.id !== "string" ||
    !page.properties ||
    typeof page.properties !== "object"
  )
    return null;
  const props = page.properties as Record<
    string,
    {
      type?: string;
      title?: { plain_text?: string; text?: { content?: string } }[];
      files?: unknown[];
    }
  >;
  const title =
    props.Name?.title ||
    Object.values(props).find((prop) => prop.type === "title")?.title;
  const name = title
    ?.map((part) => part.plain_text ?? part.text?.content ?? "")
    .join("")
    .trim();
  if (!name) return null;
  function image(source: unknown): string | null {
    if (!source || typeof source !== "object") return null;
    const item = source as {
      external?: { url?: unknown };
      file?: { url?: unknown };
    };
    const url = item.external?.url ?? item.file?.url;
    if (typeof url !== "string") return null;
    try {
      return ["https:", "http:"].includes(new URL(url).protocol) ? url : null;
    } catch {
      return null;
    }
  }
  const photo =
    image(props.Logo?.files?.[0]) ||
    image(props.Photo?.files?.[0]) ||
    image(page.icon) ||
    image(page.cover);
  return { id: page.id, name, photo };
}
