// Loads .env so DATABASE_URL is set — tsx does not do this automatically.
// Matches prisma.config.ts, which imports dotenv for the same reason.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

// Cost factor 12 — matches hashPassword() in src/lib/auth/password.ts.
const COST = 12;

// Dev-only accounts. All share the same password, matching the README
// and the old Auth.js dev constant. 8 chars = the minimum loginRequestSchema allows.
const DEV_PASSWORD = "password";

const users = [
  { email: "admin@hack4impact.org", role: "ADMIN" as const },
  { email: "lead@hack4impact.org", role: "PROJECT_LEAD" as const },
  { email: "volunteer@hack4impact.org", role: "VOLUNTEER" as const },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, COST);

  for (const user of users) {
    await db.user.upsert({
      where: { email: user.email },
      update: { role: user.role, passwordHash },
      create: {
        email: user.email,
        passwordHash,
        role: user.role,
        directoryOptIn: true,
      },
    });
    console.log(`  ${user.role.padEnd(12)} ${user.email}`);
  }

  console.log(`\nSeed complete. Password for all accounts: ${DEV_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
