import { redirect } from 'next/navigation'

import { AuthHeader } from '@/components/ui/AuthHeader'
import { auth } from '@/lib/authn'
import { db } from '@/lib/db'
import { notionApi } from '@/lib/notion'

import SignUpForm from './SignUpForm'

export default async function SignUpPage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  const [chapters, majorRows, employerRows, genderRows, raceRows] =
    await Promise.all([
      notionApi
        .getChapters()
        .then((all) =>
          all
            .filter((c) => c.status === 'Active' || c.status === 'Forming')
            .sort((a, b) => a.university.localeCompare(b.university))
            .map((c) => ({ id: c.id, university: c.university })),
        )
        .catch(() => [] as { id: string; university: string }[]),
      db.optionList.findMany({
        where: { field: 'major' },
        orderBy: { value: 'asc' },
        select: { value: true },
      }),
      db.optionList.findMany({
        where: { field: 'employer' },
        orderBy: { value: 'asc' },
        select: { value: true },
      }),
      db.optionList.findMany({
        where: { field: 'gender' },
        orderBy: { order: 'asc' },
        select: { value: true },
      }),
      db.optionList.findMany({
        where: { field: 'ethnicity' },
        orderBy: { order: 'asc' },
        select: { value: true },
      }),
    ])

  return (
    <main className='bg-root flex min-h-screen flex-col items-center justify-center py-12'>
      <AuthHeader title='Volunteer Registration' />
      <SignUpForm
        chapters={chapters}
        majorOptions={majorRows.map((r) => r.value)}
        employerOptions={employerRows.map((r) => r.value)}
        genderOptions={genderRows.map((r) => ({
          value: r.value,
          label: r.value,
        }))}
        raceOptions={raceRows.map((r) => ({ value: r.value, label: r.value }))}
      />
    </main>
  )
}
