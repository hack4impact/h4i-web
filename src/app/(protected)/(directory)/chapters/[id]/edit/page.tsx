export default async function EditChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>TODO: Edit Chapter {id}</div>;
}
