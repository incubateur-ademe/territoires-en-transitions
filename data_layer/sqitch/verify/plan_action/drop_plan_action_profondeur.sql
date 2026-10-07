-- Verify tet:plan_action/drop_plan_action_profondeur on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_views
        WHERE schemaname = 'public' AND viewname = 'plan_action_profondeur'
    ) THEN
        RAISE EXCEPTION 'La vue plan_action_profondeur existe encore';
    END IF;
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'plan_action_profondeur'
    ) THEN
        RAISE EXCEPTION 'La fonction plan_action_profondeur existe encore';
    END IF;
END $$;

ROLLBACK;
