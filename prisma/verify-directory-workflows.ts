/**
 * Terminal check for approval / claim / transition / COD role rules.
 *
 * Does NOT reset or wipe your database. It creates a few temporary rows,
 * asserts behavior, then deletes those rows.
 *
 *   pnpm exec prisma migrate deploy   # once, if migration not applied yet
 *   pnpm db:verify:directory-workflows
 *
 * Requires local DATABASE_URL (volunteer_platform_* on localhost).
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  approveProfile,
  assignUserRole,
  claimProfileWithToken,
  createClaimToken,
  createManualProfile,
  rejectProfile,
  setOwnDirectoryOptIn,
  transitionMemberToAlumni,
} from "../src/lib/directory/workflows";
import { isMemberFacingDirectoryVisible } from "../src/lib/directory/visibility";

function assertLocal() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const host = new URL(url).hostname;
  if (!["127.0.0.1", "localhost"].includes(host)) {
    throw new Error(`Refusing non-local host: ${host}`);
  }
  if (!new URL(url).pathname.includes("volunteer_platform")) {
    throw new Error("Refusing non volunteer_platform_* database");
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

assertLocal();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const t = Date.now();
  const nationals = await db.user.create({
    data: { email: `wf-nat-${t}@example.com`, role: "NATIONALS" },
  });
  const cod = await db.user.create({
    data: { email: `wf-cod-${t}@example.com`, role: "COD" },
  });
  const owner = await db.user.create({
    data: { email: `wf-owner-${t}@example.com`, role: "VOLUNTEER" },
  });
  const other = await db.user.create({
    data: { email: `wf-other-${t}@example.com`, role: "VOLUNTEER" },
  });

  const natActor = { userId: nationals.id, role: "NATIONALS" as const };
  const codActor = { userId: cod.id, role: "COD" as const };
  const ownerActor = { userId: owner.id, role: "VOLUNTEER" as const };

  try {
    // Manual create — COD can do it; stays invisible
    const pendingish = await createManualProfile(db, codActor, "MEMBER", {
      displayName: "Manual Pat",
      contactEmail: `manual-${t}@example.com`,
    });
    assert(pendingish.userId == null, "manual create unclaimed");
    assert(pendingish.directoryOptIn === false, "manual create opted out");
    assert(pendingish.approvalStatus === "APPROVED", "manual create approved");
    assert(
      !isMemberFacingDirectoryVisible(pendingish),
      "manual create not visible"
    );

    // Approve / reject (Nationals)
    const pending = await db.member.create({
      data: {
        displayName: "Pending Pat",
        approvalStatus: "PENDING",
        directoryOptIn: false,
      },
    });
    await approveProfile(db, natActor, "MEMBER", pending.id);
    const approved = await db.member.findUniqueOrThrow({
      where: { id: pending.id },
    });
    assert(approved.approvalStatus === "APPROVED", "approved");
    await rejectProfile(db, codActor, "MEMBER", pending.id);
    const rejected = await db.member.findUniqueOrThrow({
      where: { id: pending.id },
    });
    assert(rejected.approvalStatus === "REJECTED", "rejected by COD");

    // Claim + consent
    const tokenRow = await createClaimToken(
      db,
      natActor,
      "MEMBER",
      pendingish.id
    );
    await claimProfileWithToken(db, ownerActor, tokenRow.token);
    const claimed = await db.member.findUniqueOrThrow({
      where: { id: pendingish.id },
    });
    assert(claimed.userId === owner.id, "claimed by owner");
    assert(claimed.directoryOptIn === false, "claim clears/keeps opt-out");
    await setOwnDirectoryOptIn(db, ownerActor, "MEMBER", pendingish.id, true);
    const consented = await db.member.findUniqueOrThrow({
      where: { id: pendingish.id },
    });
    assert(
      isMemberFacingDirectoryVisible(consented),
      "visible after claim+consent"
    );

    // Transition by owner
    const { member: retired, alumni } = await transitionMemberToAlumni(
      db,
      ownerActor,
      pendingish.id
    );
    assert(
      retired.directoryOptIn === false,
      "member opted out after transition"
    );
    assert(alumni.userId === owner.id, "alumni owned");
    assert(
      !(
        isMemberFacingDirectoryVisible(retired) &&
        isMemberFacingDirectoryVisible(alumni)
      ),
      "member and alumni must not both be visible"
    );

    // Role asymmetry
    let codBlocked = false;
    try {
      await assignUserRole(db, codActor, other.id, "COD");
    } catch {
      codBlocked = true;
    }
    assert(codBlocked, "COD cannot promote to COD");

    await assignUserRole(db, natActor, other.id, "COD");
    const promoted = await db.user.findUniqueOrThrow({
      where: { id: other.id },
    });
    assert(promoted.role === "COD", "Nationals can promote to COD");

    let demoteBlocked = false;
    try {
      await assignUserRole(db, codActor, other.id, "VOLUNTEER");
    } catch {
      demoteBlocked = true;
    }
    assert(demoteBlocked, "COD cannot demote a COD");

    await assignUserRole(db, natActor, other.id, "VOLUNTEER");
    const demoted = await db.user.findUniqueOrThrow({
      where: { id: other.id },
    });
    assert(demoted.role === "VOLUNTEER", "Nationals can demote COD");

    const audits = await db.adminAuditLog.count({
      where: { actorUserId: { in: [nationals.id, cod.id, owner.id] } },
    });
    assert(audits >= 5, "audit rows written");

    console.log("PASS: directory workflows verification");
  } finally {
    await db.directoryClaimToken.deleteMany({
      where: { createdByUserId: { in: [nationals.id, cod.id] } },
    });
    await db.adminAuditLog.deleteMany({
      where: { actorUserId: { in: [nationals.id, cod.id, owner.id] } },
    });
    await db.alumni.deleteMany({
      where: { userId: { in: [owner.id] } },
    });
    await db.member.deleteMany({
      where: {
        OR: [
          { userId: { in: [owner.id] } },
          { contactEmail: { endsWith: `@example.com` } },
        ],
      },
    });
    // Catch leftover pending fixture by displayName
    await db.member.deleteMany({
      where: { displayName: { in: ["Pending Pat", "Manual Pat"] } },
    });
    await db.user.deleteMany({
      where: { id: { in: [nationals.id, cod.id, owner.id, other.id] } },
    });
    await db.$disconnect();
  }
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exitCode = 1;
});
