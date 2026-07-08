'use server'

import { AuthError } from 'next-auth'

import { z } from 'zod'

import { signIn, signOut } from '@/lib/authn'
import { db } from '@/lib/db'

const optionalYear = z.preprocess(
  (v) => (!v || v === '' ? undefined : Number(v)),
  z.number().int().optional(),
)

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || undefined)

const signUpSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z
    .email('Enter a valid email address.')
    .refine(
      (e) => !e.toLowerCase().endsWith('.edu'),
      'Please use a personal email address, not a .edu address.',
    ),
  chapterId: z
    .string()
    .optional()
    .transform((v) => (!v || v === 'none' ? null : v)),
  volunteerType: z.enum(['PROFESSIONAL', 'STUDENT']).default('STUDENT'),
  startYear: optionalYear,
  employer: optionalString,
  birthYear: optionalYear,
  gender: optionalString,
  ethnicity: optionalString,
  graduationYear: optionalYear,
  major: optionalString,
})

type ActionResult = { error: string } | { success: true } | null

export async function sendMagicLink(formData: FormData): Promise<ActionResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const parsed = z.email('Enter a valid email address.').safeParse(email)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    await signIn('email', { email: parsed.data, redirect: false })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError)
      return { error: 'Failed to send sign-in link.' }
    throw error
  }
}

export async function signUpAndSendMagicLink(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    firstName: (formData.get('firstName') as string)?.trim(),
    lastName: (formData.get('lastName') as string)?.trim(),
    email: (formData.get('email') as string)?.trim().toLowerCase(),
    chapterId: (formData.get('chapterId') ?? '') as string,
    volunteerType: formData.get('volunteerType') as string,
    startYear: formData.get('startYear') as string,
    employer: (formData.get('employer') ?? '') as string,
    birthYear: formData.get('birthYear') as string,
    gender: formData.get('gender') as string,
    ethnicity: formData.get('ethnicity') as string,
    graduationYear: formData.get('graduationYear') as string,
    major: formData.get('major') as string,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const {
    firstName,
    lastName,
    email,
    chapterId,
    volunteerType,
    startYear,
    employer,
    birthYear,
    gender,
    ethnicity,
    graduationYear,
    major,
  } = parsed.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return { error: 'An account with that email already exists.' }

  await db.user.create({
    data: {
      name: `${firstName} ${lastName}`,
      email,
      chapterId,
      volunteerType,
      startYear,
      employer,
      birthYear,
      gender,
      ethnicity,
      graduationYear,
      major,
    },
  })

  try {
    await signIn('email', { email, redirect: false })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          'Account created but we could not send a sign-in link. Try signing in.',
      }
    }
    throw error
  }
}

export async function handleSignOut() {
  await signOut({ redirectTo: '/sign-in' })
}
