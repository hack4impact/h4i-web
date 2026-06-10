import { notionApi } from "@/lib/notion";
import { PartnersTable } from "@/components/ui/partners/PartnersTable";

export default async function PartnersPage() {
  const partners = await notionApi.getPartners();

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <header className="border-separator border-b px-8 py-6">
        <h1 className="text-inverse font-serif text-[28px] leading-snug font-light tracking-tight">
          Partners
        </h1>
        <p className="label text-gray-3 mt-1">{partners.length} total</p>
      </header>
      <div className="flex flex-1 flex-col overflow-hidden p-8">
        <PartnersTable partners={partners} />
      </div>
    </main>
  );
}
