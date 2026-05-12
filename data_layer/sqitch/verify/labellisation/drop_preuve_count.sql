-- Verify tet:labellisation/drop_preuve_count on pg

BEGIN;

DO $$
BEGIN
    IF to_regprocedure('public.preuve_count(integer, action_id)') IS NOT NULL THEN
        RAISE EXCEPTION 'La fonction preuve_count existe encore';
    END IF;
END $$;

ROLLBACK;
