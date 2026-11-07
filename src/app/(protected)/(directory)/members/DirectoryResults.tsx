import type { DirectorySearchHit } from "@/lib/directory/search";
import { Badge } from "@/components/ui/Badge";

type Props = {
  items: DirectorySearchHit[];
};

export function DirectoryResults({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-gray-3 border-separator flex flex-1 items-center justify-center border border-dashed p-32 text-lg">
        No directory profiles match these filters.
      </div>
    );
  }

  return (
    <div className="border-separator min-h-0 flex-1 overflow-auto border">
      <table className="w-full border-collapse text-left text-lg">
        <thead className="bg-panel text-gray-3 sticky top-0">
          <tr>
            <th className="border-separator border-b px-12 py-8 font-medium">
              Name
            </th>
            <th className="border-separator border-b px-12 py-8 font-medium">
              Kind
            </th>
            <th className="border-separator border-b px-12 py-8 font-medium">
              Chapter
            </th>
            <th className="border-separator border-b px-12 py-8 font-medium">
              Role
            </th>
            <th className="border-separator border-b px-12 py-8 font-medium">
              Grad year
            </th>
            <th className="border-separator border-b px-12 py-8 font-medium">
              Skills
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={`${item.kind}:${item.id}`}
              className="hover:bg-ghost-hover"
            >
              <td className="border-separator border-b px-12 py-10">
                <div className="text-gray-1 font-medium">
                  {item.displayName ?? "Unnamed"}
                </div>
                {item.bio ? (
                  <div className="text-gray-3 mt-2 line-clamp-2 text-sm">
                    {item.bio}
                  </div>
                ) : null}
              </td>
              <td className="border-separator border-b px-12 py-10">
                <Badge
                  label={item.kind === "member" ? "Member" : "Alumni"}
                  color={item.kind === "member" ? "green" : "grey"}
                />
              </td>
              <td className="border-separator border-b px-12 py-10">
                {item.chapter?.name ?? "—"}
              </td>
              <td className="border-separator border-b px-12 py-10">
                {item.position ?? "—"}
              </td>
              <td className="border-separator border-b px-12 py-10 tabular-nums">
                {item.graduationYear ?? "—"}
              </td>
              <td className="border-separator border-b px-12 py-10">
                <span className="text-gray-2">
                  {item.skills.length > 0
                    ? item.skills.slice(0, 3).join(", ")
                    : "—"}
                  {item.skills.length > 3 ? "…" : ""}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
