import { DefaultSession } from "next-auth";
import type { AppRole } from "./index";

declare module "next-auth" {
  interface Session {
    user: {
      role: AppRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: AppRole;
  }
}
