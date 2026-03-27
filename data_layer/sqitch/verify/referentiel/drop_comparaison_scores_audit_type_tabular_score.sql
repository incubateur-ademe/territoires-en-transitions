-- Verify tet:referentiel/drop_comparaison_scores_audit_type_tabular_score on pg

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_catalog.pg_views
        WHERE schemaname = 'public'
          AND viewname = 'comparaison_scores_audit'
    ) THEN
        RAISE EXCEPTION 'public.comparaison_scores_audit should have been dropped';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_catalog.pg_matviews
        WHERE schemaname = 'public'
          AND matviewname = 'action_referentiel'
    ) THEN
        RAISE EXCEPTION 'public.action_referentiel should have been dropped';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
          AND tablename = 'type_tabular_score'
    ) THEN
        RAISE EXCEPTION 'public.type_tabular_score should have been dropped';
    END IF;
END $$;
