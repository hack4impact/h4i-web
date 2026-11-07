import type { Role } from "@prisma/client";
import { hashPassword } from "../../src/lib/auth/password";
import type { SeedClient } from "./client";
import type { ChapterId } from "./chapters";

export const SEED_PASSWORD = "password";

// Fixed ids so feature seeds and integration tests can reference users. On a
// database seeded before ids were fixed, run `pnpm db:reset` once.
export const SEED_USERS: {
  id: string;
  email: string;
  role: Role;
  chapterId: ChapterId | null;
}[] = [
  {
    id: "seed-user-admin",
    email: "admin@hack4impact.org",
    role: "NATIONAL_ADMIN",
    chapterId: null,
  },
  {
    id: "seed-user-lead-cornell",
    email: "lead@hack4impact.org",
    role: "CHAPTER_LEAD",
    chapterId: "chapter-cornell",
  },
  {
    id: "seed-user-lead-uiuc",
    email: "lead.uiuc@hack4impact.org",
    role: "CHAPTER_LEAD",
    chapterId: "chapter-uiuc",
  },
  {
    id: "seed-user-lead-berkeley",
    email: "lead.berkeley@hack4impact.org",
    role: "CHAPTER_LEAD",
    chapterId: "chapter-berkeley",
  },
  {
    id: "seed-user-lead-gt",
    email: "lead.gt@hack4impact.org",
    role: "CHAPTER_LEAD",
    chapterId: "chapter-gt",
  },
  {
    id: "seed-user-lead-bu",
    email: "lead.bu@hack4impact.org",
    role: "CHAPTER_LEAD",
    chapterId: "chapter-bu",
  },
  {
    id: "seed-user-projectlead-cornell",
    email: "projectlead@hack4impact.org",
    role: "PROJECT_LEAD",
    chapterId: "chapter-cornell",
  },
  {
    id: "seed-user-member-cornell",
    email: "member@hack4impact.org",
    role: "MEMBER",
    chapterId: "chapter-cornell",
  },
  {
    id: "seed-user-volunteer-uiuc",
    email: "volunteer.uiuc@hack4impact.org",
    role: "MEMBER",
    chapterId: "chapter-uiuc",
  },
  {
    id: "seed-user-volunteer-berkeley",
    email: "volunteer.berkeley@hack4impact.org",
    role: "MEMBER",
    chapterId: "chapter-berkeley",
  },
];

export async function seedUsers(db: SeedClient) {
  const passwordHash = await hashPassword(SEED_PASSWORD);

  for (const { id, ...user } of SEED_USERS) {
    await db.user.upsert({
      where: { email: user.email },
      update: { role: user.role, chapterId: user.chapterId, passwordHash },
      create: { id, ...user, passwordHash },
    });
  }
  return SEED_USERS.length;
}
