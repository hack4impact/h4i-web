import NextAuth from 'next-auth'
import Email from 'next-auth/providers/email'
import Google from 'next-auth/providers/google'

import { PrismaAdapter } from '@auth/prisma-adapter'

import { authConfig } from '@/lib/authn.config'
import { db } from '@/lib/db'
import type { AppRole } from '@/types'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(db as any),
  providers: [
    Email({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM ?? 'no-reply@hack4impact.org',
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
    session({ session, token }) {
      session.user.role = (token.role as AppRole) ?? 'VOLUNTEER'
      session.user.chapterId = token.chapterId as string | null | undefined
      return session
    },
    async jwt({ token, user, trigger }) {
      if (trigger === 'signIn' && user) {
        token.role = user.role
        token.chapterId = user.chapterId

        // Magic link / OAuth sign-ins: role/chapterId may not be on the user
        // object — fetch from DB to pick up the persisted defaults.
        if (!token.role && user.id) {
          const dbUser = await db.user.findUnique({
            where: { id: user.id },
            select: { role: true, chapterId: true },
          })
          token.role = (dbUser?.role as AppRole) ?? 'VOLUNTEER'
          token.chapterId = dbUser?.chapterId ?? null
        }
      } else if (token.sub) {
        // Invalidate tokens for deleted users on every refresh.
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
