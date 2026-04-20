-- Verify tet:panier_action_impact/drop_plan_from_panier on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'plan_from_panier'
    ) THEN
        RAISE EXCEPTION 'La fonction plan_from_panier existe encore';
    END IF;
END $$;

ROLLBACK;
