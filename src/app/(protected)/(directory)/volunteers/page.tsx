import { notionApi } from "@/lib/notion";
import { VolunteersTable } from "@/components/ui/volunteers/VolunteersTable";

export default async function VolunteersPage() {
  const volunteers = await notionApi.getVolunteers();

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <header className="border-separator border-b px-8 py-6">
        <h1 className="text-inverse font-serif text-[28px] leading-snug font-light tracking-tight">
          Volunteers
        </h1>
        <p className="label text-gray-3 mt-1">{volunteers.length} total</p>
      </header>
      <div className="flex flex-1 flex-col overflow-hidden p-8">
        <VolunteersTable volunteers={volunteers} />
      </div>
    </main>
  );
}
