import { redirect } from 'next/navigation'

import { auth } from '@/lib/authn'

export default async function RootPage() {
  const session = await auth()
  if (session) redirect('/dashboard')
  redirect('/sign-in')
}
