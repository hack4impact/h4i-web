import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { AppRole } from "@/types";
import { loginRequestSchema } from "@/lib/validators/auth";

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
        const parsed = loginRequestSchema.safeParse(credentials);

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
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
});
