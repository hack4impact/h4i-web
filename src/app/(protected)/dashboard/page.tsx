import { auth } from '@/lib/authn'

import { AdminDashboard } from './AdminDashboard'
import { ChapterLeaderDashboard } from './ChapterLeaderDashboard'
import { VolunteerDashboard } from './VolunteerDashboard'

export default async function DashboardPage() {
  const session = await auth()

  if (session?.user.role === 'CHAPTER_LEADER') {
    return (
      <ChapterLeaderDashboard
        userName={session.user.name}
        chapterId={session.user.chapterId}
      />
    )
  }

  if (session?.user.role === 'VOLUNTEER') {
    return (
      <VolunteerDashboard
        userId={session.user.id}
        userName={session.user.name}
      />
    )
  }

  return <AdminDashboard userName={session?.user.name} />
}
