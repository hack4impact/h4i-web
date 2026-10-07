-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('design', 'development', 'launched', 'maintenance');

-- CreateEnum
CREATE TYPE "ProjectResourceType" AS ENUM ('Slack', 'GitHub', 'GoogleDrive', 'Other');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" VARCHAR(180),
    "chapter_id" TEXT NOT NULL,
    "stage" "ProjectStage" NOT NULL DEFAULT 'design',
    "tech_stack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cause_areas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nonprofit_partner_id" TEXT,
    "nonprofit_partner_name" TEXT,
    "nonprofit_partner_photo" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "last_updated" TIMESTAMP(3),
    "problem_statement" TEXT,
    "goal_statement" TEXT,
    "solution_description" TEXT,
    "demo_media" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_draft" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_team_members" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "project_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_resource_links" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "type" "ProjectResourceType" NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "project_resource_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_is_draft_chapter_id_stage_idx" ON "projects"("is_draft", "chapter_id", "stage");

-- CreateIndex
CREATE INDEX "project_team_members_user_id_idx" ON "project_team_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_team_members_project_id_user_id_role_key" ON "project_team_members"("project_id", "user_id", "role");

-- CreateIndex
CREATE INDEX "project_resource_links_project_id_idx" ON "project_resource_links"("project_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_resource_links" ADD CONSTRAINT "project_resource_links_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
