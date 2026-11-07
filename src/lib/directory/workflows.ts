import { randomBytes } from "node:crypto";
import type {
  DirectoryApprovalStatus,
  DirectoryAuditAction,
  DirectoryAuditTargetKind,
  DirectoryPosition,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import type { AppRole } from "@/types";
import { canAssignUserRole, isDirectoryAdmin } from "@/lib/auth/roles";
import {
  hasDuplicateActiveDirectoryIdentities,
  type DirectoryVisibilityFields,
} from "@/lib/directory/visibility";
import {
  directoryProfileFieldsSchema,
  type DirectoryProfileFields,
} from "@/lib/validators/directory-profile";

export type DirectoryActor = { userId: string; role: AppRole };
export type ProfileKind = "MEMBER" | "ALUMNI";

type DbClient = PrismaClient | Prisma.TransactionClient;

const CLAIM_TTL_MS = 48 * 60 * 60 * 1000;

function assertDirectoryAdmin(actor: DirectoryActor) {
  if (!isDirectoryAdmin(actor.role)) throw new Error("Forbidden");
}

async function writeAudit(
  db: DbClient,
  input: {
    actorUserId: string;
    action: DirectoryAuditAction;
    targetKind: DirectoryAuditTargetKind;
    targetId: string;
    metadata?: Prisma.InputJsonValue;
  }
) {
  return db.adminAuditLog.create({ data: input });
}

async function loadProfile(
  db: DbClient,
  kind: ProfileKind,
  id: string
): Promise<(DirectoryVisibilityFields & { id: string }) | null> {
  if (kind === "MEMBER") {
    return db.member.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        approvalStatus: true,
        directoryOptIn: true,
        adminHidden: true,
      },
    });
  }
  return db.alumni.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      approvalStatus: true,
      directoryOptIn: true,
      adminHidden: true,
    },
  });
}

export async function approveProfile(
  db: DbClient,
  actor: DirectoryActor,
  kind: ProfileKind,
  id: string
) {
  assertDirectoryAdmin(actor);
  const existing = await loadProfile(db, kind, id);
  if (!existing) throw new Error("Not found");

  const data = { approvalStatus: "APPROVED" as const };
  const profile =
    kind === "MEMBER"
      ? await db.member.update({ where: { id }, data })
      : await db.alumni.update({ where: { id }, data });

  await writeAudit(db, {
    actorUserId: actor.userId,
    action: "PROFILE_APPROVED",
    targetKind: kind,
    targetId: id,
  });

  return profile;
}

export async function rejectProfile(
  db: DbClient,
  actor: DirectoryActor,
  kind: ProfileKind,
  id: string
) {
  assertDirectoryAdmin(actor);
  const existing = await loadProfile(db, kind, id);
  if (!existing) throw new Error("Not found");

  const data = { approvalStatus: "REJECTED" as const };
  const profile =
    kind === "MEMBER"
      ? await db.member.update({ where: { id }, data })
      : await db.alumni.update({ where: { id }, data });

  await writeAudit(db, {
    actorUserId: actor.userId,
    action: "PROFILE_REJECTED",
    targetKind: kind,
    targetId: id,
  });

  return profile;
}

/**
 * Manual create: always unclaimed, APPROVED, opted out — invisible until
 * claim + consent.
 */
export async function createManualProfile(
  db: DbClient,
  actor: DirectoryActor,
  kind: ProfileKind,
  rawFields: DirectoryProfileFields
) {
  assertDirectoryAdmin(actor);
  const fields = directoryProfileFieldsSchema.parse(rawFields);

  const data = {
    userId: null as string | null,
    approvalStatus: "APPROVED" as DirectoryApprovalStatus,
    directoryOptIn: false,
    adminHidden: false,
    displayName: fields.displayName,
    contactEmail: fields.contactEmail,
    linkedInUrl: fields.linkedInUrl,
    githubUrl: fields.githubUrl,
    websiteUrl: fields.websiteUrl,
    instagramUrl: fields.instagramUrl,
    graduationYear: fields.graduationYear,
    major: fields.major,
    location: fields.location,
    skills: fields.skills ?? [],
    interests: fields.interests ?? [],
    bio: fields.bio,
    position: fields.position as DirectoryPosition | undefined,
    chapterId: fields.chapterId,
  };

  const profile =
    kind === "MEMBER"
      ? await db.member.create({ data })
      : await db.alumni.create({ data });

  await writeAudit(db, {
    actorUserId: actor.userId,
    action: "PROFILE_MANUAL_CREATED",
    targetKind: kind,
    targetId: profile.id,
    metadata: { directoryOptIn: false, approvalStatus: "APPROVED" },
  });

  return profile;
}

export async function createClaimToken(
  db: DbClient,
  actor: DirectoryActor,
  kind: ProfileKind,
  profileId: string,
  ttlMs: number = CLAIM_TTL_MS
) {
  assertDirectoryAdmin(actor);
  const profile = await loadProfile(db, kind, profileId);
  if (!profile) throw new Error("Not found");
  if (profile.userId != null) throw new Error("Profile already claimed");

  const token = randomBytes(32).toString("hex");
  const row = await db.directoryClaimToken.create({
    data: {
      token,
      profileKind: kind,
      profileId,
      createdByUserId: actor.userId,
      expiresAt: new Date(Date.now() + ttlMs),
    },
  });

  return row;
}

export async function claimProfileWithToken(
  db: DbClient,
  actor: DirectoryActor,
  token: string
) {
  const row = await db.directoryClaimToken.findUnique({ where: { token } });
  if (!row) throw new Error("Invalid claim token");
  if (row.usedAt) throw new Error("Claim token already used");
  if (row.expiresAt.getTime() <= Date.now())
    throw new Error("Claim token expired");

  const kind = row.profileKind as ProfileKind;
  const profile = await loadProfile(db, kind, row.profileId);
  if (!profile) throw new Error("Not found");
  if (profile.userId != null) throw new Error("Profile already claimed");

  // Ownership unique per table — reject if actor already owns another of same kind.
  if (kind === "MEMBER") {
    const existing = await db.member.findUnique({
      where: { userId: actor.userId },
    });
    if (existing) throw new Error("Actor already owns a Member profile");
  } else {
    const existing = await db.alumni.findUnique({
      where: { userId: actor.userId },
    });
    if (existing) throw new Error("Actor already owns an Alumni profile");
  }

  // Use the token and take ownership in one transaction, each as a conditional
  // write, so two concurrent claims with the same token can't both succeed.
  // The ownership change trigger clears directoryOptIn automatically.
  const claim = async (tx: Prisma.TransactionClient) => {
    const used = await tx.directoryClaimToken.updateMany({
      where: { id: row.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (used.count === 0) throw new Error("Claim token already used");

    const unowned = { id: row.profileId, userId: null };
    const owned =
      kind === "MEMBER"
        ? await tx.member.updateMany({
            where: unowned,
            data: { userId: actor.userId },
          })
        : await tx.alumni.updateMany({
            where: unowned,
            data: { userId: actor.userId },
          });
    if (owned.count === 0) throw new Error("Profile already claimed");

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "PROFILE_CLAIMED",
      targetKind: kind,
      targetId: row.profileId,
    });

    return kind === "MEMBER"
      ? tx.member.findUniqueOrThrow({ where: { id: row.profileId } })
      : tx.alumni.findUniqueOrThrow({ where: { id: row.profileId } });
  };

  return "$transaction" in db ? db.$transaction(claim) : claim(db);
}

export async function setOwnDirectoryOptIn(
  db: DbClient,
  actor: DirectoryActor,
  kind: ProfileKind,
  profileId: string,
  directoryOptIn: boolean
) {
  const profile = await loadProfile(db, kind, profileId);
  if (!profile) throw new Error("Not found");
  if (profile.userId !== actor.userId) throw new Error("Forbidden");

  const updated =
    kind === "MEMBER"
      ? await db.member.update({
          where: { id: profileId },
          data: { directoryOptIn },
        })
      : await db.alumni.update({
          where: { id: profileId },
          data: { directoryOptIn },
        });

  if (directoryOptIn) {
    const visibilitySelect = {
      id: true,
      userId: true,
      approvalStatus: true,
      directoryOptIn: true,
      adminHidden: true,
    } as const;

    const member = await db.member.findUnique({
      where: { userId: actor.userId },
      select: visibilitySelect,
    });
    const alumni = await db.alumni.findUnique({
      where: { userId: actor.userId },
      select: visibilitySelect,
    });

    if (hasDuplicateActiveDirectoryIdentities(member, alumni)) {
      // Roll back the opt-in so we do not leave a dual-visible state.
      if (kind === "MEMBER") {
        await db.member.update({
          where: { id: profileId },
          data: { directoryOptIn: false },
        });
      } else {
        await db.alumni.update({
          where: { id: profileId },
          data: { directoryOptIn: false },
        });
      }
      throw new Error("Duplicate visible Member and Alumni profiles");
    }

    await writeAudit(db, {
      actorUserId: actor.userId,
      action: "PROFILE_CONSENTED",
      targetKind: kind,
      targetId: profileId,
    });
  }

  return updated;
}

export function canRunMemberToAlumniTransition(input: {
  actor: DirectoryActor;
  memberUserId: string | null;
}): boolean {
  if (isDirectoryAdmin(input.actor.role)) return true;
  return (
    input.memberUserId != null && input.memberUserId === input.actor.userId
  );
}

/**
 * Copy Member → Alumni (create or update by userId), soft-retire Member via
 * directoryOptIn=false, refuse dual member-facing visibility.
 */
export async function transitionMemberToAlumni(
  db: DbClient,
  actor: DirectoryActor,
  memberId: string
) {
  const member = await db.member.findUnique({ where: { id: memberId } });
  if (!member) throw new Error("Not found");
  if (!canRunMemberToAlumniTransition({ actor, memberUserId: member.userId })) {
    throw new Error("Forbidden");
  }

  const shared = {
    chapterId: member.chapterId,
    displayName: member.displayName,
    contactEmail: member.contactEmail,
    linkedInUrl: member.linkedInUrl,
    githubUrl: member.githubUrl,
    websiteUrl: member.websiteUrl,
    instagramUrl: member.instagramUrl,
    graduationYear: member.graduationYear,
    major: member.major,
    location: member.location,
    skills: member.skills,
    interests: member.interests,
    bio: member.bio,
    position: member.position,
    approvalStatus: member.approvalStatus,
    // Carry forward consent onto alumni, then clear member (below).
    directoryOptIn: member.directoryOptIn,
    adminHidden: member.adminHidden,
  };

  let alumni;
  if (member.userId) {
    const existing = await db.alumni.findUnique({
      where: { userId: member.userId },
    });
    if (existing) {
      alumni = await db.alumni.update({
        where: { id: existing.id },
        data: shared,
      });
    } else {
      alumni = await db.alumni.create({
        data: { ...shared, userId: member.userId },
      });
    }
  } else {
    alumni = await db.alumni.create({
      data: { ...shared, userId: null },
    });
  }

  const retiredMember = await db.member.update({
    where: { id: member.id },
    data: { directoryOptIn: false },
  });

  if (hasDuplicateActiveDirectoryIdentities(retiredMember, alumni)) {
    throw new Error("Duplicate visible Member and Alumni profiles");
  }

  await writeAudit(db, {
    actorUserId: actor.userId,
    action: "MEMBER_TO_ALUMNI_TRANSITIONED",
    targetKind: "MEMBER",
    targetId: member.id,
    metadata: { alumniId: alumni.id },
  });

  return { member: retiredMember, alumni };
}

export async function assignUserRole(
  db: DbClient,
  actor: DirectoryActor,
  targetUserId: string,
  nextRole: AppRole
) {
  const target = await db.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new Error("Not found");

  const allowed = canAssignUserRole({
    actorRole: actor.role,
    actorUserId: actor.userId,
    targetUserId,
    targetCurrentRole: target.role as AppRole,
    nextRole,
  });
  if (!allowed) throw new Error("Forbidden");

  const updated = await db.user.update({
    where: { id: targetUserId },
    data: { role: nextRole },
  });

  await writeAudit(db, {
    actorUserId: actor.userId,
    action: "USER_ROLE_CHANGED",
    targetKind: "USER",
    targetId: targetUserId,
    metadata: {
      from: target.role,
      to: nextRole,
    },
  });

  return updated;
}

export async function listRecentAdminAuditLogs(
  db: DbClient,
  actor: DirectoryActor,
  take = 50
) {
  assertDirectoryAdmin(actor);
  const limit = Math.min(Math.max(take, 1), 100);
  return db.adminAuditLog.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    include: {
      actor: { select: { id: true, email: true, role: true } },
    },
  });
}
