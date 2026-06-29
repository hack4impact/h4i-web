import { db } from '@/lib/db'

import { ChapterMembersSection } from './ChapterMembersSection'

export async function ChapterLeaderDashboard({
  userName,
  chapterId,
}: {
  userName?: string | null
  chapterId?: string | null
}) {
  const volunteers = chapterId
    ? await db.user.findMany({
        where: { chapterId, role: 'VOLUNTEER' },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
          chapterId: true,
          volunteerType: true,
          startYear: true,
          employer: true,
          birthYear: true,
          gender: true,
          ethnicity: true,
          graduationYear: true,
          major: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { accounts: true } },
        },
      })
    : []

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
          <h2 className='label text-gray-2 mb-3'>
            Chapter Members
            <span className='text-gray-4 ml-2 font-mono text-[11px]'>
              {volunteers.length}
            </span>
          </h2>
          <div className='border-separator bg-panel overflow-hidden rounded-xl border'>
            <ChapterMembersSection users={volunteers} />
          </div>
        </div>
      </div>
    </main>
  )
}
