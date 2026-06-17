export default async function VolunteerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <div>TODO: Volunteer {id}</div>
}
