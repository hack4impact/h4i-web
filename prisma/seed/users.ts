import type { Role } from "@prisma/client";
import { hashPassword } from "../../src/lib/auth/password";
import type { SeedClient } from "./client";
import type { ChapterId } from "./chapters";

export const SEED_PASSWORD = "password";

export const SEED_USERS: {
  email: string;
  role: Role;
  chapterId: ChapterId | null;
}[] = [
  { email: "admin@hack4impact.org", role: "NATIONAL_ADMIN", chapterId: null },
  {
    email: "lead@hack4impact.org",
    role: "CHAPTER_LEAD",
    chapterId: "chapter-cornell",
  },
  {
    email: "lead.uiuc@hack4impact.org",
    role: "CHAPTER_LEAD",
    chapterId: "chapter-uiuc",
  },
  {
    email: "projectlead@hack4impact.org",
    role: "PROJECT_LEAD",
    chapterId: "chapter-cornell",
  },
  {
    email: "member@hack4impact.org",
    role: "MEMBER",
    chapterId: "chapter-cornell",
  },
];

export async function seedUsers(db: SeedClient) {
  const passwordHash = await hashPassword(SEED_PASSWORD);

  for (const user of SEED_USERS) {
    await db.user.upsert({
      where: { email: user.email },
      update: { role: user.role, chapterId: user.chapterId, passwordHash },
      create: { ...user, passwordHash },
    });
  }
  return SEED_USERS.length;
}
