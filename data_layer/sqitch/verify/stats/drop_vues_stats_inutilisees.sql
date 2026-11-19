-- Verify tet:stats/drop_vues_stats_inutilisees on pg

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.stats_unique_active_users') IS NOT NULL
       OR to_regclass('stats.locales_evolution_nombre_fiches') IS NOT NULL
       OR to_regclass('private.retool_plan_action_premier_usage') IS NOT NULL
    THEN
        RAISE EXCEPTION 'Une vue stats inutilisée existe encore';
    END IF;

    IF to_regprocedure('stats.refresh_stats_locales()') IS NOT NULL
    THEN
        RAISE EXCEPTION 'stats.refresh_stats_locales existe encore';
    END IF;
END $$;

ROLLBACK;
