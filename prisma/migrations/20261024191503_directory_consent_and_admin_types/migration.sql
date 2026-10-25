-- Correction migration.
--
-- Consent: drop User.directoryOptIn without translating User-level true into
-- profile consent. Profile tables keep their own directoryOptIn.
--
-- Admin roles — FAIL CLOSED (no silent demotion, no guessing COD vs NATIONALS):
--   If any User.role = ADMIN, every such user_id must appear in public._legacy_admin_map
--   with new_role IN ('COD','NATIONALS') before this migration will proceed.
--   Create/populate that table first (prisma/map-legacy-admins.example.sql).
--   The map is applied during the enum rewrite (ADMIN never becomes VOLUNTEER).
--
--   Deployment sequence:
--     1) Inventory: SELECT id, email FROM "User" WHERE role::text = 'ADMIN';
--     2) CREATE + INSERT into _legacy_admin_map (explicit COD/NATIONALS per id)
--     3) prisma migrate deploy
--     4) Confirm roles; re-seed local Nationals/COD if needed
--
--   If an older draft already demoted ADMIN → VOLUNTEER on a database:
--   do NOT infer former admins from role = VOLUNTEER. Remap only from a roster
--   (UPDATE known accounts to COD/NATIONALS after this migration exists).
--
-- Also: Instagram URLs; visibility index includes userId;
-- ownership-change trigger clears directoryOptIn (A→B or A→null).

-- ---------------------------------------------------------------------------
-- 1) Role enum via explicit legacy ADMIN map (fail if unmapped ADMIN remains)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "_legacy_admin_map" (
    "user_id" TEXT PRIMARY KEY,
    "new_role" TEXT NOT NULL CHECK ("new_role" IN ('COD', 'NATIONALS'))
);

DO $$
DECLARE
  admin_count integer;
  unmapped_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM "User" WHERE role::text = 'ADMIN';

  SELECT COUNT(*) INTO unmapped_count
  FROM "User" u
  WHERE u.role::text = 'ADMIN'
    AND NOT EXISTS (
      SELECT 1 FROM "_legacy_admin_map" m WHERE m."user_id" = u.id
    );

  IF admin_count > 0 AND unmapped_count > 0 THEN
    RAISE EXCEPTION
      'LEGACY_ADMIN_MAPPING_REQUIRED: % of % ADMIN User row(s) lack an entry in public._legacy_admin_map (new_role COD|NATIONALS). See prisma/map-legacy-admins.example.sql. Refusing to demote to VOLUNTEER or guess.',
      unmapped_count, admin_count;
  END IF;
END $$;

-- Resolve roles to text first (PG disallows subqueries in ALTER ... USING).
ALTER TABLE "User" ADD COLUMN "role_migrated" TEXT;

UPDATE "User" u
SET "role_migrated" = CASE
  WHEN u.role::text = 'ADMIN' THEN m."new_role"
  WHEN u.role::text IN ('COD', 'NATIONALS', 'CHAPTER_LEAD', 'PROJECT_LEAD', 'VOLUNTEER')
    THEN u.role::text
  ELSE NULL
END
FROM "_legacy_admin_map" m
WHERE m."user_id" = u.id AND u.role::text = 'ADMIN';

UPDATE "User" u
SET "role_migrated" = u.role::text
WHERE u.role::text IN ('COD', 'NATIONALS', 'CHAPTER_LEAD', 'PROJECT_LEAD', 'VOLUNTEER')
  AND u."role_migrated" IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "User"
    WHERE "role_migrated" IS NULL
       OR "role_migrated" NOT IN ('COD', 'NATIONALS', 'CHAPTER_LEAD', 'PROJECT_LEAD', 'VOLUNTEER')
  ) THEN
    RAISE EXCEPTION 'LEGACY_ADMIN_MAPPING_REQUIRED: User.role contained an unmapped/unsupported value during enum rewrite';
  END IF;
END $$;

CREATE TYPE "Role_new" AS ENUM ('COD', 'NATIONALS', 'CHAPTER_LEAD', 'PROJECT_LEAD', 'VOLUNTEER');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" DROP COLUMN "role";
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

ALTER TABLE "User" ADD COLUMN "role" "Role";
UPDATE "User" SET "role" = "role_migrated"::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VOLUNTEER'::"Role";
ALTER TABLE "User" DROP COLUMN "role_migrated";

DROP TABLE IF EXISTS "_legacy_admin_map";

-- ---------------------------------------------------------------------------
-- 2) Remove User-level directory consent (profile-level remains authoritative)
-- ---------------------------------------------------------------------------
ALTER TABLE "User" DROP COLUMN "directoryOptIn";

-- ---------------------------------------------------------------------------
-- 3) Shared directory Instagram contact (PRD: alumni; mirrored on Member)
-- ---------------------------------------------------------------------------
ALTER TABLE "Member" ADD COLUMN "instagramUrl" TEXT;
ALTER TABLE "Alumni" ADD COLUMN "instagramUrl" TEXT;

-- ---------------------------------------------------------------------------
-- 4) Visibility-oriented indexes (include userId for owner requirement)
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS "Member_approvalStatus_directoryOptIn_adminHidden_idx";
DROP INDEX IF EXISTS "Alumni_approvalStatus_directoryOptIn_adminHidden_idx";

CREATE INDEX "Member_approvalStatus_directoryOptIn_adminHidden_userId_idx"
  ON "Member"("approvalStatus", "directoryOptIn", "adminHidden", "userId");

CREATE INDEX "Alumni_approvalStatus_directoryOptIn_adminHidden_userId_idx"
  ON "Alumni"("approvalStatus", "directoryOptIn", "adminHidden", "userId");

-- ---------------------------------------------------------------------------
-- 5) On ANY ownership change (A→B or A→null), force directoryOptIn = false.
--    IS DISTINCT FROM is null-safe. Same-statement opt-in with transfer is
--    overwritten — new owner must opt in on a later update.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION directory_opt_out_on_owner_change()
RETURNS trigger AS $$
BEGIN
  IF OLD."userId" IS DISTINCT FROM NEW."userId" THEN
    NEW."directoryOptIn" := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS member_owner_clear_opt_out ON "Member";
DROP TRIGGER IF EXISTS member_owner_change_opt_out ON "Member";
CREATE TRIGGER member_owner_change_opt_out
  BEFORE UPDATE OF "userId" ON "Member"
  FOR EACH ROW
  EXECUTE FUNCTION directory_opt_out_on_owner_change();

DROP TRIGGER IF EXISTS alumni_owner_clear_opt_out ON "Alumni";
DROP TRIGGER IF EXISTS alumni_owner_change_opt_out ON "Alumni";
CREATE TRIGGER alumni_owner_change_opt_out
  BEFORE UPDATE OF "userId" ON "Alumni"
  FOR EACH ROW
  EXECUTE FUNCTION directory_opt_out_on_owner_change();
