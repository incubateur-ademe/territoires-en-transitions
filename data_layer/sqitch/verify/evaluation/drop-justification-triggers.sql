-- Verify tet:evaluation/drop-justification-triggers on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND trigger_name = 'modified_at'
        AND event_object_table = 'justification'
    ) THEN
          RAISE EXCEPTION 'Trigger modified_at still exists on justification table';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND trigger_name = 'modified_by'
        AND event_object_table = 'justification'
    ) THEN
          RAISE EXCEPTION 'Trigger modified_by still exists on justification table';
    END IF;
END $$;

ROLLBACK;
