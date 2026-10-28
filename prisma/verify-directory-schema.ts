/**
 * Disposable local database/integration checks for Week 1 directory schema.
 * Not a UI/API end-to-end test — no Member/Alumni HTTP routes yet.
 *
 * Usage (export DATABASE_URL into the shell first — see manual test instructions):
 *   pnpm exec tsx prisma/verify-directory-schema.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { mapInvolvementLabelToPosition } from "../src/lib/directory/role-mappings";
import {
  hasDuplicateActiveDirectoryIdentities,
  isMemberFacingDirectoryVisible,
  memberFacingDirectoryWhere,
} from "../src/lib/directory/visibility";

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

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const userColumns: Array<{ column_name: string }> = await db.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User'
  `;
  assert(
    !userColumns.some((c) => c.column_name === "directoryOptIn"),
    "User.directoryOptIn must be removed"
  );

  const memberOptCols: Array<{ column_name: string }> = await db.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Member'
      AND column_name = 'directoryOptIn'
  `;
  const alumniOptCols: Array<{ column_name: string }> = await db.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Alumni'
      AND column_name = 'directoryOptIn'
  `;
  assert(
    memberOptCols.length === 1,
    "Member must have exactly one directoryOptIn"
  );
  assert(
    alumniOptCols.length === 1,
    "Alumni must have exactly one directoryOptIn"
  );

  console.log(
    `profile counts before: Member=${await db.member.count()} Alumni=${await db.alumni.count()}`
  );

  const chapter = await db.chapter.create({
    data: { name: `Verify Chapter ${Date.now()}` },
  });

  // Shared chapter uniqueness
  let chapterDupBlocked = false;
  try {
    await db.chapter.create({ data: { name: chapter.name } });
  } catch {
    chapterDupBlocked = true;
  }
  assert(chapterDupBlocked, "Chapter.name must be unique");

  const nationals = await db.user.create({
    data: {
      email: `verify-nationals-${Date.now()}@example.com`,
      role: "NATIONALS",
    },
  });
  const cod = await db.user.create({
    data: { email: `verify-cod-${Date.now()}@example.com`, role: "COD" },
  });
  const ownerA = await db.user.create({
    data: {
      email: `verify-owner-a-${Date.now()}@example.com`,
      role: "VOLUNTEER",
    },
  });
  const ownerB = await db.user.create({
    data: {
      email: `verify-owner-b-${Date.now()}@example.com`,
      role: "VOLUNTEER",
    },
  });

  assert(nationals.role === "NATIONALS", "NATIONALS role assignable");
  assert(cod.role === "COD", "COD role assignable");
  assert(
    !["PM", "TL", "DEVELOPER", "DESIGNER", "BUSINESS"].includes(nationals.role),
    "admin roles are not directory positions"
  );

  let adminInsertBlocked = false;
  try {
    await db.$executeRaw`INSERT INTO "User" (id, email, role, "createdAt", "updatedAt")
      VALUES ('bad_admin', 'bad-admin@example.com', 'ADMIN', NOW(), NOW())`;
  } catch {
    adminInsertBlocked = true;
  }
  assert(adminInsertBlocked, "ADMIN role value must not be insertable");

  // Defaults when approval/opt-in omitted
  const defaultedMember = await db.member.create({
    data: { displayName: "Defaulted Member", chapterId: chapter.id },
  });
  assert(
    defaultedMember.approvalStatus === "PENDING",
    "Member default PENDING"
  );
  assert(defaultedMember.directoryOptIn === false, "Member default opted out");
  assert(
    defaultedMember.adminHidden === false,
    "Member default not admin-hidden"
  );
  assert(defaultedMember.userId === null, "nullable ownership allowed");

  const defaultedAlumni = await db.alumni.create({
    data: { displayName: "Defaulted Alumni", chapterId: chapter.id },
  });
  assert(
    defaultedAlumni.approvalStatus === "PENDING",
    "Alumni default PENDING"
  );
  assert(defaultedAlumni.directoryOptIn === false, "Alumni default opted out");

  // Visibility helper + Prisma where filter (helper/query behavior — not a live API)
  const publishable = await db.member.create({
    data: {
      userId: ownerA.id,
      chapterId: chapter.id,
      displayName: "Publishable",
      approvalStatus: "APPROVED",
      directoryOptIn: true,
      adminHidden: false,
      position: "DEVELOPER",
    },
  });
  const pending = await db.member.create({
    data: {
      userId: nationals.id,
      displayName: "Pending",
      approvalStatus: "PENDING",
      directoryOptIn: true,
    },
  });
  const rejected = await db.member.create({
    data: {
      userId: cod.id,
      displayName: "Rejected",
      approvalStatus: "REJECTED",
      directoryOptIn: true,
    },
  });
  const ownerOptOut = await db.user.create({
    data: {
      email: `verify-owner-optout-${Date.now()}@example.com`,
      role: "VOLUNTEER",
    },
  });
  const optedOut = await db.member.create({
    data: {
      displayName: "OptedOutOwned",
      userId: ownerOptOut.id,
      approvalStatus: "APPROVED",
      directoryOptIn: false,
    },
  });
  const ownerHidden = await db.user.create({
    data: {
      email: `verify-owner-hidden-${Date.now()}@example.com`,
      role: "VOLUNTEER",
    },
  });
  const hidden = await db.member.create({
    data: {
      userId: ownerHidden.id,
      displayName: "Hidden",
      approvalStatus: "APPROVED",
      directoryOptIn: true,
      adminHidden: true,
    },
  });
  const ownerlessApproved = await db.member.create({
    data: {
      displayName: "OwnerlessApproved",
      approvalStatus: "APPROVED",
      directoryOptIn: true,
      adminHidden: false,
    },
  });

  assert(isMemberFacingDirectoryVisible(publishable), "publishable visible");
  assert(!isMemberFacingDirectoryVisible(pending), "pending excluded");
  assert(!isMemberFacingDirectoryVisible(rejected), "rejected excluded");
  assert(!isMemberFacingDirectoryVisible(optedOut), "opted-out excluded");
  assert(!isMemberFacingDirectoryVisible(hidden), "admin-hidden excluded");
  assert(
    !isMemberFacingDirectoryVisible(ownerlessApproved),
    "ownerless excluded"
  );

  const visibleRows = await db.member.findMany({
    where: { ...memberFacingDirectoryWhere, chapterId: chapter.id },
    select: { id: true, displayName: true },
  });
  assert(
    visibleRows.length === 1 && visibleRows[0]?.id === publishable.id,
    "memberFacingDirectoryWhere returns only publishable owned profiles in chapter"
  );

  // Unique ownership within Member
  let dupOwnerBlocked = false;
  try {
    await db.member.create({
      data: { userId: ownerA.id, displayName: "Dup owner" },
    });
  } catch {
    dupOwnerBlocked = true;
  }
  assert(dupOwnerBlocked, "Member.userId unique");

  // Unchanged ownership preserves consent
  const sameOwner = await db.member.update({
    where: { id: publishable.id },
    data: { displayName: "Publishable renamed", userId: ownerA.id },
  });
  assert(sameOwner.directoryOptIn === true, "unchanged owner preserves opt-in");

  // A→B clears opt-in even with same-statement opt-in true
  const transferred = await db.member.update({
    where: { id: publishable.id },
    data: { userId: ownerB.id, directoryOptIn: true },
  });
  assert(transferred.userId === ownerB.id, "A→B ownership");
  assert(transferred.directoryOptIn === false, "A→B clears opt-in");

  // null→B clears opt-in (claim) even with same-statement opt-in true
  const claimed = await db.member.update({
    where: { id: defaultedMember.id },
    data: {
      userId: ownerA.id,
      directoryOptIn: true,
      approvalStatus: "APPROVED",
    },
  });
  assert(claimed.userId === ownerA.id, "null→B ownership");
  assert(claimed.directoryOptIn === false, "null→B clears opt-in");

  // Re-opt-in without ownership change works
  const reOptIn = await db.member.update({
    where: { id: claimed.id },
    data: { directoryOptIn: true },
  });
  assert(reOptIn.directoryOptIn === true, "explicit later opt-in works");

  // Alumni + relationships; A→B; dual visible detection; owner delete
  const alumni = await db.alumni.create({
    data: {
      userId: ownerA.id,
      chapterId: chapter.id,
      displayName: "Alumni A",
      instagramUrl: "https://instagram.com/alumni",
      approvalStatus: "APPROVED",
      directoryOptIn: true,
      position: "TL",
      jobExperiences: {
        create: [
          { company: "Co", title: "Eng", startYear: 2024, isCurrent: true },
        ],
      },
      hackInvolvements: {
        create: [
          {
            roleLabel: "Tech Lead",
            position: mapInvolvementLabelToPosition("Tech Lead"),
            startYear: 2022,
            endYear: 2023,
          },
        ],
      },
    },
    include: { jobExperiences: true, hackInvolvements: true },
  });
  assert(alumni.jobExperiences.length === 1, "job experience present");
  assert(
    alumni.hackInvolvements[0]?.position === "TL",
    "involvement position mapped"
  );

  const alumniTransferred = await db.alumni.update({
    where: { id: alumni.id },
    data: { userId: ownerB.id, directoryOptIn: true },
  });
  assert(
    alumniTransferred.directoryOptIn === false,
    "alumni A→B clears opt-in"
  );

  await db.alumni.update({
    where: { id: alumni.id },
    data: { directoryOptIn: true },
  });
  // Make member under ownerB publishable again for dual-identity detection
  await db.member.update({
    where: { id: publishable.id },
    data: {
      approvalStatus: "APPROVED",
      directoryOptIn: true,
      adminHidden: false,
    },
  });
  const memberNow = await db.member.findUniqueOrThrow({
    where: { id: publishable.id },
  });
  const alumniNow = await db.alumni.findUniqueOrThrow({
    where: { id: alumni.id },
  });
  assert(
    hasDuplicateActiveDirectoryIdentities(memberNow, alumniNow),
    "detection helper flags duplicate visible identities"
  );
  console.log(
    "DUPLICATE_IDENTITY: detected by helper only — prevention in directory reads is FUTURE WORK (no Member/Alumni list API)"
  );

  // A→null via owner delete
  await db.user.delete({ where: { id: ownerB.id } });
  const memberAfterDelete = await db.member.findUniqueOrThrow({
    where: { id: publishable.id },
  });
  const alumniAfterDelete = await db.alumni.findUniqueOrThrow({
    where: { id: alumni.id },
    include: { jobExperiences: true, hackInvolvements: true },
  });
  assert(
    memberAfterDelete.userId === null,
    "member unclaimed after owner delete"
  );
  assert(
    memberAfterDelete.directoryOptIn === false,
    "member opted out on A→null"
  );
  assert(alumniAfterDelete.userId === null, "alumni unclaimed");
  assert(
    alumniAfterDelete.directoryOptIn === false,
    "alumni opted out on A→null"
  );
  assert(alumniAfterDelete.jobExperiences.length === 1, "jobs survive");
  assert(
    alumniAfterDelete.hackInvolvements.length === 1,
    "involvements survive"
  );
  assert(!isMemberFacingDirectoryVisible(memberAfterDelete), "not visible");
  assert(!isMemberFacingDirectoryVisible(alumniAfterDelete), "not visible");

  // Cleanup verification rows
  await db.alumniHackInvolvement.deleteMany({ where: { alumniId: alumni.id } });
  await db.alumniJobExperience.deleteMany({ where: { alumniId: alumni.id } });
  await db.alumni.deleteMany({
    where: { id: { in: [alumni.id, defaultedAlumni.id] } },
  });
  await db.member.deleteMany({
    where: {
      id: {
        in: [
          publishable.id,
          defaultedMember.id,
          pending.id,
          rejected.id,
          optedOut.id,
          hidden.id,
          ownerlessApproved.id,
        ],
      },
    },
  });
  await db.chapter.delete({ where: { id: chapter.id } });
  await db.user.deleteMany({
    where: {
      id: {
        in: [nationals.id, cod.id, ownerA.id, ownerOptOut.id, ownerHidden.id],
      },
    },
  });

  console.log("verify-directory-schema: OK");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
