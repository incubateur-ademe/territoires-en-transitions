-- Verify tet:collectivite/remove_set_modified_at_trigger_discussion_table on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND trigger_name = 'set_modified_at'
    ) THEN
        RAISE EXCEPTION 'Trigger set_modified_at still exists';
    END IF;
END $$;

ROLLBACK;
