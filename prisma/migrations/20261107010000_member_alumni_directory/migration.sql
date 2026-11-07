-- Member & Alumni Directory: profiles, job/involvement history, admin audit
-- log, and profile claim tokens. Profile-level consent replaces
-- User.directoryOptIn.

-- CreateEnum
CREATE TYPE "DirectoryAuditAction" AS ENUM ('PROFILE_APPROVED', 'PROFILE_REJECTED', 'PROFILE_MANUAL_CREATED', 'PROFILE_CLAIMED', 'PROFILE_CONSENTED', 'MEMBER_TO_ALUMNI_TRANSITIONED', 'USER_ROLE_CHANGED');

-- CreateEnum
CREATE TYPE "DirectoryAuditTargetKind" AS ENUM ('MEMBER', 'ALUMNI', 'USER');

-- CreateEnum
CREATE TYPE "DirectoryClaimProfileKind" AS ENUM ('MEMBER', 'ALUMNI');

-- CreateEnum
CREATE TYPE "DirectoryPosition" AS ENUM ('PM', 'TL', 'DEVELOPER', 'DESIGNER', 'BUSINESS');

-- CreateEnum
CREATE TYPE "DirectoryApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "directoryOptIn";

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "chapterId" TEXT,
    "displayName" TEXT,
    "contactEmail" TEXT,
    "linkedInUrl" TEXT,
    "githubUrl" TEXT,
    "websiteUrl" TEXT,
    "instagramUrl" TEXT,
    "graduationYear" INTEGER,
    "major" TEXT,
    "location" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "position" "DirectoryPosition",
    "approvalStatus" "DirectoryApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "directoryOptIn" BOOLEAN NOT NULL DEFAULT false,
    "adminHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alumni" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "chapterId" TEXT,
    "displayName" TEXT,
    "contactEmail" TEXT,
    "linkedInUrl" TEXT,
    "githubUrl" TEXT,
    "websiteUrl" TEXT,
    "instagramUrl" TEXT,
    "graduationYear" INTEGER,
    "major" TEXT,
    "location" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "position" "DirectoryPosition",
    "approvalStatus" "DirectoryApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "directoryOptIn" BOOLEAN NOT NULL DEFAULT false,
    "adminHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alumni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlumniJobExperience" (
    "id" TEXT NOT NULL,
    "alumniId" TEXT NOT NULL,
    "company" TEXT,
    "title" TEXT,
    "location" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlumniJobExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlumniHackInvolvement" (
    "id" TEXT NOT NULL,
    "alumniId" TEXT NOT NULL,
    "chapterId" TEXT,
    "roleLabel" TEXT,
    "position" "DirectoryPosition",
    "projectName" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlumniHackInvolvement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");

-- CreateIndex
CREATE INDEX "Member_chapterId_idx" ON "Member"("chapterId");

-- CreateIndex
CREATE INDEX "Member_approvalStatus_directoryOptIn_adminHidden_userId_idx" ON "Member"("approvalStatus", "directoryOptIn", "adminHidden", "userId");

-- CreateIndex
CREATE INDEX "Member_graduationYear_idx" ON "Member"("graduationYear");

-- CreateIndex
CREATE UNIQUE INDEX "Alumni_userId_key" ON "Alumni"("userId");

-- CreateIndex
CREATE INDEX "Alumni_chapterId_idx" ON "Alumni"("chapterId");

-- CreateIndex
CREATE INDEX "Alumni_approvalStatus_directoryOptIn_adminHidden_userId_idx" ON "Alumni"("approvalStatus", "directoryOptIn", "adminHidden", "userId");

-- CreateIndex
CREATE INDEX "Alumni_graduationYear_idx" ON "Alumni"("graduationYear");

-- CreateIndex
CREATE INDEX "AlumniJobExperience_alumniId_idx" ON "AlumniJobExperience"("alumniId");

-- CreateIndex
CREATE INDEX "AlumniHackInvolvement_alumniId_idx" ON "AlumniHackInvolvement"("alumniId");

-- CreateIndex
CREATE INDEX "AlumniHackInvolvement_chapterId_idx" ON "AlumniHackInvolvement"("chapterId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_actorUserId_createdAt_idx" ON "AdminAuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DirectoryClaimToken_token_key" ON "DirectoryClaimToken"("token");

-- CreateIndex
CREATE INDEX "DirectoryClaimToken_profileKind_profileId_idx" ON "DirectoryClaimToken"("profileKind", "profileId");

-- CreateIndex
CREATE INDEX "DirectoryClaimToken_expiresAt_idx" ON "DirectoryClaimToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alumni" ADD CONSTRAINT "Alumni_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alumni" ADD CONSTRAINT "Alumni_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniJobExperience" ADD CONSTRAINT "AlumniJobExperience_alumniId_fkey" FOREIGN KEY ("alumniId") REFERENCES "Alumni"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniHackInvolvement" ADD CONSTRAINT "AlumniHackInvolvement_alumniId_fkey" FOREIGN KEY ("alumniId") REFERENCES "Alumni"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniHackInvolvement" ADD CONSTRAINT "AlumniHackInvolvement_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectoryClaimToken" ADD CONSTRAINT "DirectoryClaimToken_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Any change of owner (A to B, or A to null) clears directory opt-in, so a
-- new owner must consent themselves.
CREATE OR REPLACE FUNCTION directory_opt_out_on_owner_change()
RETURNS trigger AS $$
BEGIN
  IF OLD."userId" IS DISTINCT FROM NEW."userId" THEN
    NEW."directoryOptIn" := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS member_owner_change_opt_out ON "Member";
DROP TRIGGER IF EXISTS alumni_owner_change_opt_out ON "Alumni";

CREATE TRIGGER member_owner_change_opt_out
  BEFORE UPDATE OF "userId" ON "Member"
  FOR EACH ROW
  EXECUTE FUNCTION directory_opt_out_on_owner_change();

CREATE TRIGGER alumni_owner_change_opt_out
  BEFORE UPDATE OF "userId" ON "Alumni"
  FOR EACH ROW
  EXECUTE FUNCTION directory_opt_out_on_owner_change();

