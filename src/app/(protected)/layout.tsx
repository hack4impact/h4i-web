import { redirect } from 'next/navigation'

import { Sidebar } from '@/components/layout/Sidebar'
import { auth } from '@/lib/authn'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/sign-in')

  return (
    <div className='bg-root flex h-screen overflow-hidden'>
      <Sidebar userName={session.user.name} userRole={session.user.role} />
      <div className='bg-root flex min-w-0 flex-1 flex-col overflow-hidden'>
        {children}
      </div>
    </div>
  )
}
