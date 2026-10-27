import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import type { AppRole } from "@/types";

// TODO: replace with real database auth
const DEV_EMAIL = "admin@hack4impact.org";
const DEV_PASSWORD = "password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.email(), password: z.string().min(1) })
          .safeParse(credentials);

        if (!parsed.success) return null;

        if (
          parsed.data.email !== DEV_EMAIL ||
          parsed.data.password !== DEV_PASSWORD
        )
          return null;

        return {
          id: "dev-admin",
          name: "Admin",
          email: DEV_EMAIL,
          role: "ADMIN",
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: AppRole }).role ?? "ADMIN";
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as AppRole;
      session.user.id = token.sub!;
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
});
