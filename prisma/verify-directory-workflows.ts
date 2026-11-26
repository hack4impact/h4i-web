/**
 * Terminal check for approval / claim / transition / role-change rules.
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
    data: { email: `wf-nat-${t}@example.com`, role: "NATIONAL_ADMIN" },
  });
  const admin2 = await db.user.create({
    data: { email: `wf-admin2-${t}@example.com`, role: "NATIONAL_ADMIN" },
  });
  const owner = await db.user.create({
    data: { email: `wf-owner-${t}@example.com`, role: "MEMBER" },
  });
  const other = await db.user.create({
    data: { email: `wf-other-${t}@example.com`, role: "MEMBER" },
  });

  const natActor = { userId: nationals.id, role: "NATIONAL_ADMIN" as const };
  const admin2Actor = { userId: admin2.id, role: "NATIONAL_ADMIN" as const };
  const ownerActor = { userId: owner.id, role: "MEMBER" as const };

  // Everything this run creates, so cleanup deletes only these rows.
  const userIds = [nationals.id, admin2.id, owner.id, other.id];
  const memberIds: string[] = [];
  const alumniIds: string[] = [];

  try {
    // Manual create — any directory admin can do it; stays invisible
    const pendingish = await createManualProfile(db, admin2Actor, "MEMBER", {
      displayName: "Manual Pat",
      contactEmail: `manual-${t}@example.com`,
    });
    memberIds.push(pendingish.id);
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
    memberIds.push(pending.id);
    await approveProfile(db, natActor, "MEMBER", pending.id);
    const approved = await db.member.findUniqueOrThrow({
      where: { id: pending.id },
    });
    assert(approved.approvalStatus === "APPROVED", "approved");
    await rejectProfile(db, admin2Actor, "MEMBER", pending.id);
    const rejected = await db.member.findUniqueOrThrow({
      where: { id: pending.id },
    });
    assert(
      rejected.approvalStatus === "REJECTED",
      "rejected by a second admin"
    );

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
    alumniIds.push(alumni.id);
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

    // Role changes: directory admins only, never on their own account
    let memberBlocked = false;
    try {
      await assignUserRole(db, ownerActor, other.id, "CHAPTER_LEAD");
    } catch {
      memberBlocked = true;
    }
    assert(memberBlocked, "A member cannot change roles");

    let selfBlocked = false;
    try {
      await assignUserRole(db, natActor, nationals.id, "MEMBER");
    } catch {
      selfBlocked = true;
    }
    assert(selfBlocked, "An admin cannot change their own role");

    await assignUserRole(db, natActor, other.id, "NATIONAL_ADMIN");
    const promoted = await db.user.findUniqueOrThrow({
      where: { id: other.id },
    });
    assert(
      promoted.role === "NATIONAL_ADMIN",
      "Nationals can promote to admin"
    );

    await assignUserRole(db, admin2Actor, other.id, "MEMBER");
    const demoted = await db.user.findUniqueOrThrow({
      where: { id: other.id },
    });
    assert(demoted.role === "MEMBER", "Another admin can demote an admin");

    const audits = await db.adminAuditLog.count({
      where: { actorUserId: { in: [nationals.id, admin2.id, owner.id] } },
    });
    assert(audits >= 5, "audit rows written");

    console.log("PASS: directory workflows verification");
  } finally {
    await db.directoryClaimToken.deleteMany({
      where: { createdByUserId: { in: userIds } },
    });
    await db.adminAuditLog.deleteMany({
      where: { actorUserId: { in: userIds } },
    });
    await db.alumni.deleteMany({ where: { id: { in: alumniIds } } });
    await db.member.deleteMany({ where: { id: { in: memberIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  }
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exitCode = 1;
});
