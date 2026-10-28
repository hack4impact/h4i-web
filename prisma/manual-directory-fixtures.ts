/**
 * Create / clean fictional directory fixtures for local database/integration checks.
 *
 * Always export DATABASE_URL into the shell first (Prisma .env is not auto-exported
 * for psql). Example disposable DB:
 *   export DATABASE_URL='postgresql://USER@127.0.0.1:5432/volunteer_platform_week1_test'
 *
 * Create (prints exact export MID=… BID=…):
 *   pnpm exec tsx prisma/manual-directory-fixtures.ts
 *
 * Cleanup only those IDs (paste the printed exports first):
 *   pnpm exec tsx prisma/manual-directory-fixtures.ts --cleanup
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function assertLocalDisposableUrl(url: string | undefined) {
  if (!url) throw new Error("DATABASE_URL is required");
  const allowedHosts = new Set(["127.0.0.1", "localhost"]);
  const parsed = new URL(url);
  if (!allowedHosts.has(parsed.hostname)) {
    throw new Error(`Refusing non-local DATABASE_URL host: ${parsed.hostname}`);
  }
  if (!parsed.pathname.includes("volunteer_platform")) {
    throw new Error(
      `Refusing DATABASE_URL that is not a volunteer_platform_* DB: ${parsed.pathname}`
    );
  }
}

assertLocalDisposableUrl(process.env.DATABASE_URL);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env ${name} for cleanup`);
  return value;
}

async function cleanup() {
  const memberId = requireEnv("MID");
  const alumniId = requireEnv("ALUMNI_ID");
  const chapterId = requireEnv("CHAPTER_ID");
  const userIds = [
    requireEnv("NAT_ID"),
    requireEnv("COD_ID"),
    requireEnv("OWNER_A_ID"),
    requireEnv("OWNER_B_ID"),
  ];

  await db.alumniHackInvolvement.deleteMany({ where: { alumniId } });
  await db.alumniJobExperience.deleteMany({ where: { alumniId } });
  await db.alumni.deleteMany({ where: { id: alumniId } });
  await db.member.deleteMany({ where: { id: memberId } });
  await db.chapter.deleteMany({ where: { id: chapterId } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });

  console.log("cleanup: deleted exact fixture IDs only");
  console.log({
    MID: memberId,
    ALUMNI_ID: alumniId,
    CHAPTER_ID: chapterId,
    users: userIds,
  });
}

async function create() {
  const t = Date.now();
  const chapter = await db.chapter.create({
    data: { name: `Manual Fixture Chapter ${t}` },
  });
  const nationals = await db.user.create({
    data: { email: `manual-nat-${t}@example.com`, role: "NATIONALS" },
  });
  const cod = await db.user.create({
    data: { email: `manual-cod-${t}@example.com`, role: "COD" },
  });
  const ownerA = await db.user.create({
    data: { email: `manual-owner-a-${t}@example.com`, role: "VOLUNTEER" },
  });
  const ownerB = await db.user.create({
    data: { email: `manual-owner-b-${t}@example.com`, role: "VOLUNTEER" },
  });

  const member = await db.member.create({
    data: {
      userId: ownerA.id,
      chapterId: chapter.id,
      displayName: "Manual Fixture Member",
      approvalStatus: "PENDING",
      directoryOptIn: false,
    },
  });

  const alumni = await db.alumni.create({
    data: {
      userId: ownerA.id,
      chapterId: chapter.id,
      displayName: "Manual Fixture Alumni",
      approvalStatus: "PENDING",
      directoryOptIn: false,
      jobExperiences: {
        create: [
          {
            company: "Fixture Co",
            title: "Engineer",
            startYear: 2024,
            isCurrent: true,
          },
        ],
      },
    },
  });

  console.log(
    "# Fixture defaults: approvalStatus=PENDING, directoryOptIn=false"
  );
  console.log(
    "# Copy/paste these exports before the ownership-transfer check:\n"
  );
  console.log(`export MID='${member.id}'`);
  console.log(`export BID='${ownerB.id}'`);
  console.log(`export AID='${ownerA.id}'`);
  console.log(`export ALUMNI_ID='${alumni.id}'`);
  console.log(`export NAT_ID='${nationals.id}'`);
  console.log(`export COD_ID='${cod.id}'`);
  console.log(`export OWNER_A_ID='${ownerA.id}'`);
  console.log(`export OWNER_B_ID='${ownerB.id}'`);
  console.log(`export CHAPTER_ID='${chapter.id}'`);
  console.log("\n# Cleanup later (same shell, after tests):");
  console.log("pnpm exec tsx prisma/manual-directory-fixtures.ts --cleanup");
}

async function main() {
  if (process.argv.includes("--cleanup")) {
    await cleanup();
  } else {
    await create();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
