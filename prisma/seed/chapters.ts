import type { SeedClient } from "./client";

// Stable ids so feature seeds can reference chapters.
// TODO: replace with the official chapter list from Nationals.
export const CHAPTERS = [
  { id: "chapter-cornell", name: "Cornell University", region: "Northeast" },
  { id: "chapter-uiuc", name: "UIUC", region: "Midwest" },
  { id: "chapter-berkeley", name: "UC Berkeley", region: "West" },
  { id: "chapter-gt", name: "Georgia Tech", region: "Southeast" },
  { id: "chapter-bu", name: "Boston University", region: "Northeast" },
  { id: "chapter-umd", name: "University of Maryland", region: "Mid-Atlantic" },
  { id: "chapter-calpoly", name: "Cal Poly", region: "West" },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];

export const CHAPTER_IDS = Object.fromEntries(
  CHAPTERS.map((c) => [c.id.replace("chapter-", ""), c.id])
) as Record<string, ChapterId>;

export async function seedChapters(db: SeedClient) {
  for (const chapter of CHAPTERS) {
    await db.chapter.upsert({
      where: { id: chapter.id },
      update: { name: chapter.name, region: chapter.region },
      create: chapter,
    });
  }
  return CHAPTERS.length;
}
