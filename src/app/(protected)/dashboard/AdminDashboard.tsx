import Link from 'next/link'

import {
  ArrowRight,
  Building2,
  FolderOpen,
  Handshake,
  Users,
} from 'lucide-react'

import { db } from '@/lib/db'
import { notionApi } from '@/lib/notion'

import { AdminDataSection } from './AdminDataSection'

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className='border-separator bg-panel flex flex-col gap-1 rounded-xl border p-5'>
      <p className='label text-gray-3'>{label}</p>
      <p className='text-inverse font-sans text-4xl font-light tracking-tight'>
        {value}
      </p>
      {sub && <p className='label-xs text-gray-4'>{sub}</p>}
    </div>
  )
}

const sections = [
  {
    href: '/chapters',
    label: 'Chapters',
    Icon: Building2,
    description: 'Universities & chapters',
  },
  {
    href: '/partners',
    label: 'Partners',
    Icon: Handshake,
    description: 'Nonprofit partners',
  },
  {
    href: '/projects',
    label: 'Projects',
    Icon: FolderOpen,
    description: 'Active & past projects',
  },
  {
    href: '/volunteers',
    label: 'Volunteers',
    Icon: Users,
    description: 'Members & alumni',
  },
]

export async function AdminDashboard({
  userName,
}: {
  userName?: string | null
}) {
  const [
    volunteerCounts,
    chapters,
    partners,
    doneProjectCount,
    users,
    accounts,
    options,
  ] = await Promise.all([
    notionApi.getVolunteerCounts(),
    notionApi.getChapters(),
    notionApi.getPartners(),
    notionApi.getDoneProjectCount(),
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
        raceEthnicity: true,
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
  const activeChapters = chapters.filter((c) => c.status === 'Active').length

  return (
    <main className='flex flex-1 flex-col overflow-hidden'>
      <header className='border-separator border-b px-8 py-6'>
        <h1 className='text-inverse font-serif text-[28px] leading-snug font-light tracking-tight'>
          {firstName}'s Dashboard
        </h1>
      </header>

      <div className='flex-1 overflow-y-auto p-8'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <StatCard
            label='Active Volunteers'
            value={volunteerCounts.active}
            sub={`${volunteerCounts.total} total`}
          />
          <StatCard
            label='Active Chapters'
            value={activeChapters}
            sub={`${chapters.length} total`}
          />
          <StatCard label='Completed Projects' value={doneProjectCount} />
          <StatCard label='Partners' value={partners.length} />
        </div>

        <div className='mt-8'>
          <h2 className='label text-gray-2 mb-3'>Directory</h2>
          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
            {sections.map(({ href, label, Icon, description }) => (
              <Link
                key={href}
                href={href}
                className='border-separator bg-panel hover:border-gray-3 group flex items-center gap-4 rounded-xl border p-4 transition-colors'
              >
                <div className='bg-panel-highlight-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg'>
                  <Icon size={16} strokeWidth={1.5} className='text-blue-500' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='label text-inverse'>{label}</p>
                  <p className='label-xs text-gray-3'>{description}</p>
                </div>
                <ArrowRight
                  size={14}
                  strokeWidth={1.5}
                  className='text-gray-4 group-hover:text-gray-2 shrink-0 transition-colors'
                />
              </Link>
            ))}
          </div>
        </div>

        <AdminDataSection users={users} accounts={accounts} options={options} />
      </div>
    </main>
  )
}
