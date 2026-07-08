'use client'

import { useActionState } from 'react'

import Link from 'next/link'

import { Form } from '@base-ui/react/form'

import { sendMagicLink } from '@/actions/auth'
import { TextField } from '@/components/forms/FormFields'
import { Button } from '@/components/ui/Button'

type ActionState = { error: string } | { success: true } | null

async function action(_: ActionState, fd: FormData): Promise<ActionState> {
  return (await sendMagicLink(fd)) ?? null
}

export default function SignInForm() {
  const [state, formAction, isPending] = useActionState(action, null)

  if (state && 'success' in state) {
    return (
      <div className='w-full max-w-[360px] px-4 text-center'>
        <p className='label text-inverse'>Check your email</p>
        <p className='label-xs text-gray-3 mt-1'>
          We sent a sign-in link to your inbox.
        </p>
      </div>
    )
  }

  return (
    <div className='w-full max-w-[360px] px-4'>
      <Form action={formAction} className='flex flex-col gap-5'>
        <TextField
          label='Email'
          name='email'
          type='email'
          autoComplete='email'
          placeholder='you@example.com'
          required
        />

        {state && 'error' in state && (
          <p className='label-xs -mt-1 text-orange-500'>{state.error}</p>
        )}

        <Button type='submit' disabled={isPending} className='mt-1 w-full'>
          {isPending ? 'Sending…' : 'Send sign-in link'}
        </Button>
      </Form>

      <p className='label-xs text-gray-3 mt-8 text-center'>
        Don&apos;t have an account?{' '}
        <Link
          href='/sign-up'
          className='text-blue-500 transition-colors hover:text-blue-600'
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
