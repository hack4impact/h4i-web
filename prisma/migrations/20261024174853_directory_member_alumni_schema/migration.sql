-- Week 1 directory schema (Member / Alumni / Chapter).
-- Additive only: no changes to existing User / Session / MagicLinkToken columns.
-- Backfill / defaults for future legacy imports into Member or Alumni:
--   approvalStatus = PENDING (do not silently approve)
--   directoryOptIn = false (opted out until explicit consent)
--   adminHidden    = false
--   userId / chapterId nullable (unclaimed / unknown affiliation)
-- Existing User.directoryOptIn values are preserved untouched.

-- CreateEnum
CREATE TYPE "DirectoryPosition" AS ENUM ('PM', 'TL', 'DEVELOPER', 'DESIGNER', 'BUSINESS');

-- CreateEnum
CREATE TYPE "DirectoryApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

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

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_name_key" ON "Chapter"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");

-- CreateIndex
CREATE INDEX "Member_chapterId_idx" ON "Member"("chapterId");

-- CreateIndex
CREATE INDEX "Member_approvalStatus_directoryOptIn_adminHidden_idx" ON "Member"("approvalStatus", "directoryOptIn", "adminHidden");

-- CreateIndex
CREATE INDEX "Member_graduationYear_idx" ON "Member"("graduationYear");

-- CreateIndex
CREATE UNIQUE INDEX "Alumni_userId_key" ON "Alumni"("userId");

-- CreateIndex
CREATE INDEX "Alumni_chapterId_idx" ON "Alumni"("chapterId");

-- CreateIndex
CREATE INDEX "Alumni_approvalStatus_directoryOptIn_adminHidden_idx" ON "Alumni"("approvalStatus", "directoryOptIn", "adminHidden");

-- CreateIndex
CREATE INDEX "Alumni_graduationYear_idx" ON "Alumni"("graduationYear");

-- CreateIndex
CREATE INDEX "AlumniJobExperience_alumniId_idx" ON "AlumniJobExperience"("alumniId");

-- CreateIndex
CREATE INDEX "AlumniHackInvolvement_alumniId_idx" ON "AlumniHackInvolvement"("alumniId");

-- CreateIndex
CREATE INDEX "AlumniHackInvolvement_chapterId_idx" ON "AlumniHackInvolvement"("chapterId");

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
