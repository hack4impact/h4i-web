import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { authConfig } from '@/lib/authn.config'
import { db } from '@/lib/db'
import type { AppRole } from '@/types'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(db as any),
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.email(), password: z.string().min(1) })
          .safeParse(credentials)

        if (!parsed.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user?.password) return null

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as AppRole,
          chapterId: user.chapterId,
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    session: authConfig.callbacks!.session!,
    async jwt({ token, user, trigger }) {
      if (trigger === 'signIn' && user) {
        token.role = user.role
        token.chapterId = user.chapterId

        // OAuth sign-ins: role/chapterId may not be on the user object —
        // fetch from DB to pick up the persisted defaults.
        if (!token.role && user.id) {
          const dbUser = await db.user.findUnique({
            where: { id: user.id },
            select: { role: true, chapterId: true },
          })
          token.role = (dbUser?.role as AppRole) ?? 'VOLUNTEER'
          token.chapterId = dbUser?.chapterId ?? null
        }
      } else if (token.sub) {
        const exists = await db.user.findUnique({
          where: { id: token.sub },
          select: { id: true },
        })
        if (!exists) return null
      }
      return token
    },
  },
})
