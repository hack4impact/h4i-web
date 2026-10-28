-- Follow-up for databases that already applied an earlier draft of
-- 20261024191503 where opt-out only ran when userId became NULL.
-- Idempotent: replaces the function and rebinds triggers so ANY ownership
-- change (A→B or A→null) clears directoryOptIn (null-safe IS DISTINCT FROM).
-- Unchanged ownership does not clear consent.
--
-- Also documents legacy-admin recovery when an older draft demoted ADMIN→VOLUNTEER:
-- do not infer former admins from VOLUNTEER; remap from an external roster only.

CREATE OR REPLACE FUNCTION directory_opt_out_on_owner_change()
RETURNS trigger AS $$
BEGIN
  IF OLD."userId" IS DISTINCT FROM NEW."userId" THEN
    NEW."directoryOptIn" := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop legacy names from earlier drafts
DROP TRIGGER IF EXISTS member_owner_clear_opt_out ON "Member";
DROP TRIGGER IF EXISTS alumni_owner_clear_opt_out ON "Alumni";
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

-- Optional cleanup of renamed function from earlier draft
DROP FUNCTION IF EXISTS directory_opt_out_on_owner_clear();
