import rawData from "../../notion-data/export.json";

export type DirectoryRow = Record<string, string>;

function normalize(rows: Record<string, unknown>[]): DirectoryRow[] {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => [
        k,
        Array.isArray(v) ? v.join(", ") : String(v ?? ""),
      ])
    )
  );
}

export const chapters = normalize(
  rawData.chapters as Record<string, unknown>[]
);
export const projects = normalize(
  rawData.projects as Record<string, unknown>[]
);
export const partners = normalize(
  rawData.partners as Record<string, unknown>[]
);
export const volunteers = normalize(
  rawData.volunteers as Record<string, unknown>[]
);
