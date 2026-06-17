'use server'

import { AuthError } from 'next-auth'

import bcrypt from 'bcryptjs'
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
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  chapterId: z
    .string()
    .optional()
    .transform((v) => (!v || v === 'none' ? null : v)),
  volunteerType: z.enum(['PROFESSIONAL', 'STUDENT']).default('STUDENT'),
  startYear: optionalYear,
  employer: optionalString,
  birthYear: optionalYear,
  gender: optionalString,
  raceEthnicity: optionalString,
  graduationYear: optionalYear,
  major: optionalString,
})

export async function credentialsSignIn(formData: FormData) {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: '/dashboard',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Invalid email or password.' }
    }
    throw error // re-throw redirect
  }
}

export async function credentialsSignUp(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    firstName: (formData.get('firstName') as string)?.trim(),
    lastName: (formData.get('lastName') as string)?.trim(),
    email: (formData.get('email') as string)?.trim().toLowerCase(),
    password: formData.get('password'),
    chapterId: (formData.get('chapterId') ?? '') as string,
    volunteerType: formData.get('volunteerType') as string,
    startYear: formData.get('startYear') as string,
    employer: (formData.get('employer') ?? '') as string,
    birthYear: formData.get('birthYear') as string,
    gender: formData.get('gender') as string,
    raceEthnicity: formData.get('raceEthnicity') as string,
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
    password,
    chapterId,
    volunteerType,
    startYear,
    employer,
    birthYear,
    gender,
    raceEthnicity,
    graduationYear,
    major,
  } = parsed.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return { error: 'An account with that email already exists.' }

  const hashed = await bcrypt.hash(password, 12)
  await db.user.create({
    data: {
      name: `${firstName} ${lastName}`,
      email,
      password: hashed,
      chapterId,
      volunteerType,
      startYear,
      employer,
      birthYear,
      gender,
      raceEthnicity,
      graduationYear,
      major,
    },
  })

  try {
    await signIn('credentials', { email, password, redirectTo: '/dashboard' })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Account created but sign-in failed. Please sign in.' }
    }
    throw error
  }
}

export async function credentialsSignOut() {
  await signOut({ redirectTo: '/sign-in' })
}
