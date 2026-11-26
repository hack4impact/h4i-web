-- Role enum renamed in place (rows keep their meaning), shared Chapter table,
-- User.chapterId replaces the free-text operationsChapterId.

ALTER TYPE "Role" RENAME VALUE 'ADMIN' TO 'NATIONAL_ADMIN';
ALTER TYPE "Role" RENAME VALUE 'VOLUNTEER' TO 'MEMBER';
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Chapter_name_key" ON "Chapter"("name");

ALTER TABLE "User" DROP COLUMN "operationsChapterId";
ALTER TABLE "User" ADD COLUMN "chapterId" TEXT;

CREATE INDEX "User_chapterId_idx" ON "User"("chapterId");

ALTER TABLE "User" ADD CONSTRAINT "User_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
