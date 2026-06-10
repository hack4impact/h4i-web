export default async function PartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>TODO: Partner {id}</div>;
}
