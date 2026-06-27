-- CreateEnum
CREATE TYPE "VolunteerType" AS ENUM ('PROFESSIONAL', 'STUDENT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthYear" INTEGER,
ADD COLUMN     "employer" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "graduationYear" INTEGER,
ADD COLUMN     "major" TEXT,
ADD COLUMN     "raceEthnicity" TEXT,
ADD COLUMN     "startYear" INTEGER,
ADD COLUMN     "volunteerType" "VolunteerType";
