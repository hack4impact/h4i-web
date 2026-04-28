import type { NextAuthConfig } from "next-auth";
import type { AppRole } from "@/types";

// Edge-safe base config. No DB, no bcrypt, no Node.js-only imports.
// Middleware creates a NextAuth instance from this directly.
// auth.ts spreads this and adds the adapter + providers.
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    jwt({ token, user, trigger }) {
      if (trigger === "signIn" && user) {
        token.role = user.role;
        token.chapterId = user.chapterId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = (token.role as AppRole) ?? "VOLUNTEER";
      session.user.chapterId = token.chapterId as string | null | undefined;
      return session;
    },
  },
} satisfies NextAuthConfig;
