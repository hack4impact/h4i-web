import { auth } from '@/lib/authn'

import { AdminDashboard } from './AdminDashboard'
import { ChapterLeaderDashboard } from './ChapterLeaderDashboard'

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

  return <AdminDashboard userName={session?.user.name} />
}
