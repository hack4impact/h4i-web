import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const users = [
  { name: "Admin", email: "admin@hack4impact.org", role: "ADMIN" as const },
  {
    name: "Chapter Leader",
    email: "chapter@hack4impact.org",
    role: "CHAPTER_LEADER" as const,
  },
  {
    name: "Volunteer",
    email: "volunteer@hack4impact.org",
    role: "VOLUNTEER" as const,
  },
];

async function main() {
  const password = await bcrypt.hash("password", 10);
  for (const user of users) {
    await db.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, password },
    });
  }
  console.log("Seeded", users.length, "users");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
