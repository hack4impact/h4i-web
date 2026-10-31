import { PageHeader } from "@/components/ui/PageHeader";
import {
  listDirectoryChapters,
  searchDirectory,
} from "@/actions/directory-search";
import { parseDirectorySearchParams } from "@/lib/validators/directory-search";
import { DirectorySearchControls } from "./DirectorySearchControls";
import { DirectoryResults } from "./DirectoryResults";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MembersDirectoryPage({
  searchParams,
}: PageProps) {
  const raw = await searchParams;
  const params = parseDirectorySearchParams(raw);

  const [result, chapters] = await Promise.all([
    searchDirectory(params),
    listDirectoryChapters(),
  ]);

  return (
    <div className="flex h-full flex-col pt-32">
      <PageHeader
        title="Member Directory"
        subtitle="Search visible members and alumni. State is kept in the URL."
      />
      <div className="flex min-h-0 flex-1 flex-col gap-16 p-32 pt-0">
        <DirectorySearchControls
          params={result.params}
          chapters={chapters}
          total={result.total}
          pageCount={result.pageCount}
        />
        <DirectoryResults items={result.items} />
      </div>
    </div>
  );
}
