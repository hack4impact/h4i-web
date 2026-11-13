export async function chapterLabels(ids: string[]) {
  const names = new Map([
    ["seed-chapter-boston", "Boston"],
    ["seed-chapter-chicago", "Chicago"],
    ["seed-chapter-atlanta", "Atlanta"],
  ]);
  if (process.env.NOTION_API_KEY) {
    try {
      const { getChapters } = await import("@/lib/notion/api");
      const { rows } = await getChapters();
      for (const row of rows) {
        const name = row.Name || row.name || row["Chapter Name"];
        if (name) names.set(row.id, name);
      }
    } catch {
      // Browsing projects remains available when the external directory is down.
    }
  }
  return ids
    .map((id) => ({ id, name: names.get(id) || `Chapter ${id}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
