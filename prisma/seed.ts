import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // TODO: seed users
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
