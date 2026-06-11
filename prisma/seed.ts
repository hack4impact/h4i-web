import { PrismaClient } from "../src/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  MAJOR_SUGGESTIONS,
  GENDER_SUGGESTIONS,
  RACE_SUGGESTIONS,
} from "../src/lib/field-options";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const lists: { field: string; values: string[] }[] = [
  { field: "major", values: MAJOR_SUGGESTIONS },
  { field: "gender", values: GENDER_SUGGESTIONS },
  { field: "race_ethnicity", values: RACE_SUGGESTIONS },
];

async function main() {
  // Seed all option lists (always runs — order is preserved via the order column)
  for (const { field, values } of lists) {
    await db.optionList.createMany({
      data: values.map((value, order) => ({ field, value, order })),
      skipDuplicates: true,
    });
    console.log(`Seeded ${values.length} options for "${field}"`);
  }

  // Seed admin account (requires env vars)
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    console.warn(
      "Skipping admin account: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env.local to seed it."
    );
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  await db.user.upsert({
    where: { email },
    update: {},
    create: { name, email, password: hashed, role: "ADMIN" },
  });
  console.log(`Seeded admin account: ${email}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
