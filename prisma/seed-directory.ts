/**
 * Repeatable development seed for Member / Alumni directory search.
 *
 * Command (pnpm 10):
 *   pnpm db:seed:directory
 *
 * Requirements:
 *   - DATABASE_URL must point at a local volunteer_platform_* database
 *   - ALLOW_DIRECTORY_SEED=true must be set (refuses otherwise)
 *   - Never run against shared/staging/production
 *
 * Behavior:
 *   - Upserts ≥50 directory-visible profiles across ≥3 chapters
 *   - Mix of members and alumni, varied DirectoryPosition values and years
 *   - Adds clearly labeled visibility edge cases (pending / opted-out /
 *     admin-hidden / unclaimed) that do NOT count toward the visible ≥50
 *   - Scoped to seed-owned records via stable emails and chapter name prefix
 *   - Reruns are idempotent (no duplicate chapters/users/profiles)
 *
 * Cleanup of seed-owned rows only:
 *   pnpm db:seed:directory -- --cleanup
 */
import "dotenv/config";
import { PrismaClient, type DirectoryPosition } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const SEED_PREFIX = "[directory-seed]";
const EMAIL_DOMAIN = "directory-seed.example";
const CHAPTER_NAMES = [
  `${SEED_PREFIX} Cedar Lake University`,
  `${SEED_PREFIX} Riverton College`,
  `${SEED_PREFIX} Northbridge Tech`,
] as const;

const POSITIONS: DirectoryPosition[] = [
  "PM",
  "TL",
  "DEVELOPER",
  "DESIGNER",
  "BUSINESS",
];

const FIRST_NAMES = [
  "Avery",
  "Blake",
  "Casey",
  "Drew",
  "Eden",
  "Finley",
  "Gray",
  "Harper",
  "Indigo",
  "Jordan",
  "Kai",
  "Logan",
  "Morgan",
  "Noel",
  "Oakley",
  "Parker",
  "Quinn",
  "Reese",
  "Sage",
  "Taylor",
] as const;

const LAST_NAMES = [
  "Nguyen",
  "Patel",
  "Garcia",
  "Kim",
  "Ali",
  "Brooks",
  "Chen",
  "Diaz",
  "Evans",
  "Foster",
] as const;

const SKILLS = [
  "TypeScript",
  "React",
  "PostgreSQL",
  "Figma",
  "Python",
  "Product discovery",
  "Accessibility",
  "GraphQL",
] as const;

const INTERESTS = [
  "civic tech",
  "education",
  "climate",
  "public health",
  "open source",
  "mentorship",
] as const;

const VISIBLE_MEMBER_COUNT = 35;
const VISIBLE_ALUMNI_COUNT = 20;
// 35 + 20 = 55 visible profiles (≥50), across 3 chapters.

function assertSafeSeedEnvironment() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing directory seed in NODE_ENV=production");
  }
  if (process.env.ALLOW_DIRECTORY_SEED !== "true") {
    throw new Error(
      "Refusing directory seed: set ALLOW_DIRECTORY_SEED=true for local disposable DBs only"
    );
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const parsed = new URL(url);
  const allowedHosts = new Set(["127.0.0.1", "localhost"]);
  if (!allowedHosts.has(parsed.hostname)) {
    throw new Error(`Refusing non-local DATABASE_URL host: ${parsed.hostname}`);
  }
  if (!parsed.pathname.includes("volunteer_platform")) {
    throw new Error(
      `Refusing DATABASE_URL that is not a volunteer_platform_* DB: ${parsed.pathname}`
    );
  }
}

function pad(n: number): string {
  return String(n).padStart(3, "0");
}

function emailFor(kind: "member" | "alumni" | "edge", n: number): string {
  return `${kind}-${pad(n)}@${EMAIL_DOMAIN}`;
}

function displayName(n: number): string {
  const first = FIRST_NAMES[n % FIRST_NAMES.length]!;
  const last = LAST_NAMES[n % LAST_NAMES.length]!;
  return `${first} ${last}`;
}

function pickSkills(n: number): string[] {
  return [SKILLS[n % SKILLS.length]!, SKILLS[(n + 3) % SKILLS.length]!];
}

function pickInterests(n: number): string[] {
  return [
    INTERESTS[n % INTERESTS.length]!,
    INTERESTS[(n + 2) % INTERESTS.length]!,
  ];
}

function graduationYear(n: number): number {
  return 2018 + (n % 10);
}

assertSafeSeedEnvironment();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function cleanupSeedOwned() {
  const seedUsers = await db.user.findMany({
    where: { email: { endsWith: `@${EMAIL_DOMAIN}` } },
    select: { id: true },
  });
  const userIds = seedUsers.map((u) => u.id);

  // Seed alumni / members are owned by seed users OR use seed contact emails /
  // displayName markers for the unclaimed edge case.
  await db.alumniHackInvolvement.deleteMany({
    where: {
      alumni: {
        OR: [
          { userId: { in: userIds } },
          { contactEmail: { endsWith: `@${EMAIL_DOMAIN}` } },
          { displayName: { startsWith: `${SEED_PREFIX} ` } },
        ],
      },
    },
  });
  await db.alumniJobExperience.deleteMany({
    where: {
      alumni: {
        OR: [
          { userId: { in: userIds } },
          { contactEmail: { endsWith: `@${EMAIL_DOMAIN}` } },
          { displayName: { startsWith: `${SEED_PREFIX} ` } },
        ],
      },
    },
  });
  await db.alumni.deleteMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        { contactEmail: { endsWith: `@${EMAIL_DOMAIN}` } },
        { displayName: { startsWith: `${SEED_PREFIX} ` } },
      ],
    },
  });
  await db.member.deleteMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        { contactEmail: { endsWith: `@${EMAIL_DOMAIN}` } },
        { displayName: { startsWith: `${SEED_PREFIX} ` } },
      ],
    },
  });
  await db.user.deleteMany({
    where: { email: { endsWith: `@${EMAIL_DOMAIN}` } },
  });
  await db.chapter.deleteMany({
    where: { name: { startsWith: SEED_PREFIX } },
  });

  console.log(
    "cleanup: removed directory-seed-owned chapters, users, profiles"
  );
}

async function upsertChapter(name: string) {
  return db.chapter.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function upsertSeedUser(email: string) {
  return db.user.upsert({
    where: { email },
    update: { role: "VOLUNTEER" },
    create: { email, role: "VOLUNTEER" },
  });
}

async function upsertVisibleMember(
  index: number,
  chapterId: string
): Promise<void> {
  const email = emailFor("member", index);
  const user = await upsertSeedUser(email);
  const position = POSITIONS[index % POSITIONS.length]!;
  const data = {
    chapterId,
    displayName: displayName(index),
    contactEmail: email,
    graduationYear: graduationYear(index),
    major: index % 2 === 0 ? "Computer Science" : "Information Systems",
    location: index % 3 === 0 ? "Remote" : "On campus",
    skills: pickSkills(index),
    interests: pickInterests(index),
    bio: `${SEED_PREFIX} Member bio for ${displayName(index)} focusing on ${pickInterests(index)[0]}.`,
    position,
    approvalStatus: "APPROVED" as const,
    directoryOptIn: true,
    adminHidden: false,
  };

  const existing = await db.member.findUnique({ where: { userId: user.id } });
  if (existing) {
    await db.member.update({ where: { id: existing.id }, data });
  } else {
    await db.member.create({ data: { ...data, userId: user.id } });
  }
}

async function upsertVisibleAlumni(
  index: number,
  chapterId: string
): Promise<void> {
  const email = emailFor("alumni", index);
  const user = await upsertSeedUser(email);
  const position = POSITIONS[index % POSITIONS.length]!;
  const data = {
    chapterId,
    displayName: displayName(index + 50),
    contactEmail: email,
    graduationYear: graduationYear(index + 2),
    major: "Software Engineering",
    location: "Alumni network",
    skills: pickSkills(index + 1),
    interests: pickInterests(index + 1),
    bio: `${SEED_PREFIX} Alumni bio for ${displayName(index + 50)} — ${pickSkills(index + 1)[0]}.`,
    position,
    approvalStatus: "APPROVED" as const,
    directoryOptIn: true,
    adminHidden: false,
  };

  const existing = await db.alumni.findUnique({ where: { userId: user.id } });
  let alumniId: string;
  if (existing) {
    const updated = await db.alumni.update({
      where: { id: existing.id },
      data,
    });
    alumniId = updated.id;
    await db.alumniJobExperience.deleteMany({ where: { alumniId } });
    await db.alumniHackInvolvement.deleteMany({ where: { alumniId } });
  } else {
    const created = await db.alumni.create({
      data: { ...data, userId: user.id },
    });
    alumniId = created.id;
  }

  await db.alumniJobExperience.create({
    data: {
      alumniId,
      company: `${SEED_PREFIX} Example Corp ${index}`,
      title: position === "DESIGNER" ? "Product Designer" : "Software Engineer",
      startYear: graduationYear(index + 2),
      isCurrent: true,
    },
  });
  await db.alumniHackInvolvement.create({
    data: {
      alumniId,
      chapterId,
      roleLabel: position,
      position,
      projectName: `${SEED_PREFIX} Project ${index}`,
      startYear: graduationYear(index + 2) - 2,
      endYear: graduationYear(index + 2),
    },
  });
}

async function upsertEdgeCases(chapterId: string) {
  // 1) Pending approval (owned, opted in) — not visible
  {
    const user = await upsertSeedUser(emailFor("edge", 1));
    const data = {
      chapterId,
      displayName: `${SEED_PREFIX} Pending Pat`,
      contactEmail: emailFor("edge", 1),
      approvalStatus: "PENDING" as const,
      directoryOptIn: true,
      adminHidden: false,
      skills: ["TypeScript"],
      interests: ["civic tech"],
      bio: `${SEED_PREFIX} visibility edge: pending`,
    };
    const existing = await db.member.findUnique({ where: { userId: user.id } });
    if (existing) await db.member.update({ where: { id: existing.id }, data });
    else await db.member.create({ data: { ...data, userId: user.id } });
  }

  // 2) Opted out (owned, approved) — not visible
  {
    const user = await upsertSeedUser(emailFor("edge", 2));
    const data = {
      chapterId,
      displayName: `${SEED_PREFIX} OptOut Quinn`,
      contactEmail: emailFor("edge", 2),
      approvalStatus: "APPROVED" as const,
      directoryOptIn: false,
      adminHidden: false,
      skills: ["React"],
      interests: ["education"],
      bio: `${SEED_PREFIX} visibility edge: opted out`,
    };
    const existing = await db.member.findUnique({ where: { userId: user.id } });
    if (existing) await db.member.update({ where: { id: existing.id }, data });
    else await db.member.create({ data: { ...data, userId: user.id } });
  }

  // 3) Admin hidden (owned, approved, opted in) — not visible
  {
    const user = await upsertSeedUser(emailFor("edge", 3));
    const data = {
      chapterId,
      displayName: `${SEED_PREFIX} Hidden Harper`,
      contactEmail: emailFor("edge", 3),
      approvalStatus: "APPROVED" as const,
      directoryOptIn: true,
      adminHidden: true,
      skills: ["Figma"],
      interests: ["climate"],
      bio: `${SEED_PREFIX} visibility edge: admin hidden`,
    };
    const existing = await db.alumni.findUnique({ where: { userId: user.id } });
    if (existing) await db.alumni.update({ where: { id: existing.id }, data });
    else await db.alumni.create({ data: { ...data, userId: user.id } });
  }

  // 4) Unclaimed (no userId) — not visible
  {
    const markerEmail = emailFor("edge", 4);
    const existing = await db.member.findFirst({
      where: { contactEmail: markerEmail, userId: null },
    });
    const data = {
      userId: null as string | null,
      chapterId,
      displayName: `${SEED_PREFIX} Unclaimed Uma`,
      contactEmail: markerEmail,
      approvalStatus: "APPROVED" as const,
      directoryOptIn: true,
      adminHidden: false,
      skills: ["Python"],
      interests: ["public health"],
      bio: `${SEED_PREFIX} visibility edge: unclaimed`,
    };
    if (existing) {
      await db.member.update({ where: { id: existing.id }, data });
    } else {
      await db.member.create({ data });
    }
  }
}

async function seed() {
  const chapters = [];
  for (const name of CHAPTER_NAMES) {
    chapters.push(await upsertChapter(name));
  }

  for (let i = 1; i <= VISIBLE_MEMBER_COUNT; i++) {
    const chapter = chapters[(i - 1) % chapters.length]!;
    await upsertVisibleMember(i, chapter.id);
  }
  for (let i = 1; i <= VISIBLE_ALUMNI_COUNT; i++) {
    const chapter = chapters[(i - 1) % chapters.length]!;
    await upsertVisibleAlumni(i, chapter.id);
  }

  await upsertEdgeCases(chapters[0]!.id);

  const visibleMembers = await db.member.count({
    where: {
      contactEmail: { endsWith: `@${EMAIL_DOMAIN}` },
      userId: { not: null },
      approvalStatus: "APPROVED",
      directoryOptIn: true,
      adminHidden: false,
    },
  });
  const visibleAlumni = await db.alumni.count({
    where: {
      contactEmail: { endsWith: `@${EMAIL_DOMAIN}` },
      userId: { not: null },
      approvalStatus: "APPROVED",
      directoryOptIn: true,
      adminHidden: false,
    },
  });

  console.log("directory seed complete");
  console.log({
    chapters: CHAPTER_NAMES.length,
    visibleMembers,
    visibleAlumni,
    visibleTotal: visibleMembers + visibleAlumni,
    edgeCases: 4,
  });
}

async function main() {
  const cleanup = process.argv.includes("--cleanup");
  if (cleanup) {
    await cleanupSeedOwned();
    return;
  }
  await seed();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
