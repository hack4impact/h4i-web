'use client'

import { TextField } from '@/components/forms/FormFields'

const BLOCKED_DOMAINS = ['hack4impact.org']

function validateEmail(value: unknown): string | null {
  const email = String(value ?? '')
  if (!email.includes('@')) return null
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  if (BLOCKED_DOMAINS.some((d) => domain === d || domain.endsWith('.' + d)))
    return 'Use your personal email, not a Hack4Impact address'
  if (domain.endsWith('.edu'))
    return 'Use your personal email, not a .edu address'
  return null
}

function validatePassword(value: unknown): string | null {
  const pw = String(value ?? '')
  if (pw.length > 0 && pw.length < 8) return 'Must be at least 8 characters'
  return null
}

export function AccountTab() {
  return (
    <>
      <div className='grid grid-cols-2 gap-3'>
        <TextField
          label='First name'
          name='firstName'
          type='text'
          autoComplete='given-name'
          placeholder='Jane'
          required
        />
        <TextField
          label='Last name'
          name='lastName'
          type='text'
          autoComplete='family-name'
          placeholder='Smith'
          required
        />
      </div>

      <TextField
        label='Email address'
        name='email'
        type='email'
        autoComplete='email'
        placeholder='you@example.com'
        required
        validate={validateEmail}
      />

      <TextField
        label='Password'
        name='password'
        type='password'
        autoComplete='new-password'
        placeholder='Min. 8 characters'
        required
        validate={validatePassword}
      />
    </>
  )
}
