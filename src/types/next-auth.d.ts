import { DefaultSession } from "next-auth";
import { Role } from "./index";

declare module "next-auth" {
  interface Session {
    user: {
      role: Role;
      chapterId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    chapterId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    chapterId: string | null;
  }
}
