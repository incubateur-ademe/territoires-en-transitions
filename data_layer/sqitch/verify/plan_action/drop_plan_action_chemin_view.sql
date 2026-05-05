-- Verify tet:plan_action/drop_plan_action_chemin_view on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_views
        WHERE schemaname = 'public' AND viewname = 'plan_action_chemin'
    ) THEN
        RAISE EXCEPTION 'La vue plan_action_chemin existe encore';
    END IF;
END $$;

ROLLBACK;
