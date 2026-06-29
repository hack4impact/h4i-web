import { db } from '@/lib/db'

import { AdminDataSection } from './AdminDataSection'

export async function AdminDashboard({
  userName,
}: {
  userName?: string | null
}) {
  const [users, accounts, options] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: 'desc' },
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
    }),
    db.account.findMany({
      orderBy: { provider: 'asc' },
      select: {
        id: true,
        userId: true,
        type: true,
        provider: true,
        providerAccountId: true,
        token_type: true,
        scope: true,
        expires_at: true,
        session_state: true,
      },
    }),
    db.optionList.findMany({ orderBy: [{ field: 'asc' }, { order: 'asc' }] }),
  ])

  const firstName = userName?.split(' ')[0] ?? 'there'

  return (
    <main className='flex flex-1 flex-col overflow-hidden'>
      <header className='border-separator border-b px-8 py-6'>
        <h1 className='text-inverse font-serif text-[28px] leading-snug font-light tracking-tight'>
          {firstName}'s Dashboard
        </h1>
      </header>

      <div className='flex flex-1 flex-col overflow-hidden p-8'>
        <AdminDataSection users={users} accounts={accounts} options={options} />
      </div>
    </main>
  )
}
