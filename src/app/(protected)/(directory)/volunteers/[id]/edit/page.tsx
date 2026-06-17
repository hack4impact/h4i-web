export default async function EditVolunteerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <div>TODO: Edit Volunteer {id}</div>
}
