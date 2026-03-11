export default async function EditChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>Edit Chapter: {id}</div>;
}
