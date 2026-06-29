import { db } from '@/lib/db'

function ProfileRow({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  if (!value) return null
  return (
    <div>
      <p className='label-xs text-gray-3 mb-0.5'>{label}</p>
      <p className='label text-inverse'>{value}</p>
    </div>
  )
}

export async function VolunteerDashboard({
  userId,
  userName,
}: {
  userId?: string | null
  userName?: string | null
}) {
  const user = userId
    ? await db.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          role: true,
          chapterId: true,
          volunteerType: true,
          startYear: true,
          employer: true,
          major: true,
          graduationYear: true,
          birthYear: true,
          gender: true,
          ethnicity: true,
        },
      })
    : null

  const firstName = userName?.split(' ')[0] ?? 'there'

  return (
    <main className='flex flex-1 flex-col overflow-hidden'>
      <header className='border-separator border-b px-8 py-6'>
        <h1 className='text-inverse font-serif text-[28px] leading-snug font-light tracking-tight'>
          Good morning, {firstName}
        </h1>
      </header>

      <div className='flex-1 overflow-y-auto p-8'>
        <div>
          <h2 className='label text-gray-2 mb-3'>My Profile</h2>
          <div className='border-separator bg-panel rounded-xl border p-5'>
            <div className='grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3'>
              <ProfileRow label='Name' value={user?.name} />
              <ProfileRow label='Email' value={user?.email} />
              <ProfileRow label='Role' value={user?.role} />
              <ProfileRow label='Chapter' value={user?.chapterId} />
              <ProfileRow label='Volunteer Type' value={user?.volunteerType} />
              <ProfileRow label='Start Year' value={user?.startYear} />
              <ProfileRow label='Employer' value={user?.employer} />
              <ProfileRow label='Major' value={user?.major} />
              <ProfileRow
                label='Graduation Year'
                value={user?.graduationYear}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
