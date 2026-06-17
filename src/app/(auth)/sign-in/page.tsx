import { redirect } from 'next/navigation'

import { AuthHeader } from '@/components/ui/AuthHeader'
import { auth } from '@/lib/authn'

import SignInForm from './SignInForm'

export default async function SignInPage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <main className='bg-root flex min-h-screen flex-col items-center justify-center py-12'>
      <AuthHeader title='Sign in' />
      <SignInForm />
    </main>
  )
}
