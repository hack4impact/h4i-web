import { PrismaClient } from "../src/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  MAJOR_SUGGESTIONS,
  COMPANY_SUGGESTIONS,
  GENDER_SUGGESTIONS,
  RACE_SUGGESTIONS,
} from "../src/lib/field-options";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const OPTION_LISTS: { field: string; values: string[] }[] = [
  { field: "major", values: MAJOR_SUGGESTIONS },
  { field: "employer", values: COMPANY_SUGGESTIONS },
  { field: "gender", values: GENDER_SUGGESTIONS },
  { field: "race_ethnicity", values: RACE_SUGGESTIONS },
];

async function main() {
  await db.account.deleteMany();
  await db.verificationToken.deleteMany();
  await db.user.deleteMany();
  await db.optionList.deleteMany();

  for (const { field, values } of OPTION_LISTS) {
    await db.optionList.createMany({
      data: values.map((value, order) => ({ field, value, order })),
    });
    console.log(`Seeded ${values.length} options for "${field}"`);
  }

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
  await db.user.create({
    data: { name, email, password: hashed, role: "ADMIN" },
  });
  console.log(`Seeded admin account: ${email}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
