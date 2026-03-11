import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  await db.user.upsert({
    where: { email: "admin@hack4impact.org" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@hack4impact.org",
      password: await bcrypt.hash("password", 10),
      role: "ADMIN",
    },
  });

  console.log("Seed complete");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
