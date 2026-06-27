import { notionApi } from "@/lib/notion";
import { contentfulApi } from "@/lib/contentful";
import { ChaptersTable } from "@/components/ui/chapters/ChaptersTable";

export default async function ChaptersPage() {
  const chapters = await notionApi.getChapters();

  const imageUrls = await Promise.all(
    chapters.map((c) => contentfulApi.getAssetUrl(c.slug))
  );
  const images: Record<string, string | null> = {};
  chapters.forEach((c, i) => {
    images[c.slug] = imageUrls[i];
  });

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <header className="border-separator border-b px-8 py-6">
        <h1 className="text-inverse font-serif text-[28px] leading-snug font-light tracking-tight">
          Chapters
        </h1>
        <p className="label text-gray-3 mt-1">{chapters.length} total</p>
      </header>
      <div className="flex flex-1 flex-col overflow-hidden p-8">
        <ChaptersTable chapters={chapters} images={images} />
      </div>
    </main>
  );
}
