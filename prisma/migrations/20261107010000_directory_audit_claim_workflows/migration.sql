-- Directory moderation audit trail + verified claim tokens.
-- Additive only. COD and NATIONALS are peer directory admins in application code;
-- role-assignment asymmetry (Nationals-only COD grant/demotion) is enforced in app.

CREATE TYPE "DirectoryAuditAction" AS ENUM (
  'PROFILE_APPROVED',
  'PROFILE_REJECTED',
  'PROFILE_MANUAL_CREATED',
  'PROFILE_CLAIMED',
  'PROFILE_CONSENTED',
  'MEMBER_TO_ALUMNI_TRANSITIONED',
  'USER_ROLE_CHANGED'
);

CREATE TYPE "DirectoryAuditTargetKind" AS ENUM ('MEMBER', 'ALUMNI', 'USER');

CREATE TYPE "DirectoryClaimProfileKind" AS ENUM ('MEMBER', 'ALUMNI');

CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" "DirectoryAuditAction" NOT NULL,
    "targetKind" "DirectoryAuditTargetKind" NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DirectoryClaimToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "profileKind" "DirectoryClaimProfileKind" NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectoryClaimToken_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
CREATE INDEX "AdminAuditLog_actorUserId_createdAt_idx" ON "AdminAuditLog"("actorUserId", "createdAt");
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");

CREATE UNIQUE INDEX "DirectoryClaimToken_token_key" ON "DirectoryClaimToken"("token");
CREATE INDEX "DirectoryClaimToken_profileKind_profileId_idx" ON "DirectoryClaimToken"("profileKind", "profileId");
CREATE INDEX "DirectoryClaimToken_expiresAt_idx" ON "DirectoryClaimToken"("expiresAt");

ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DirectoryClaimToken" ADD CONSTRAINT "DirectoryClaimToken_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
