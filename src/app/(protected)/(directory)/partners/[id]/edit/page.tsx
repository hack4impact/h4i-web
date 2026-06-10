export default async function EditPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>TODO: Edit Partner {id}</div>;
}
