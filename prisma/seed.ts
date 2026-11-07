// Development seed: `pnpm db:seed`. One module per feature under prisma/seed/,
// each idempotent so the seed can be re-run after a migration.
import { createSeedClient } from "./seed/client";
import { seedChapters } from "./seed/chapters";
import { SEED_PASSWORD, SEED_USERS, seedUsers } from "./seed/users";

const db = createSeedClient();

async function main() {
  const chapters = await seedChapters(db);
  const users = await seedUsers(db);

  console.log(`Seeded ${chapters} chapters and ${users} users.`);
  console.log(`Password for every seed account: ${SEED_PASSWORD}`);
  for (const u of SEED_USERS) {
    console.log(
      `  ${u.role.padEnd(14)} ${u.email.padEnd(32)} ${u.chapterId ?? "-"}`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
