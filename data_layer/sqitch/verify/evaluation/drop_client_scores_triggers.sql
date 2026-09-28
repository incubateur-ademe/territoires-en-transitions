-- Verify tet:evaluation/drop_client_scores_triggers on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND event_object_table = 'client_scores'
    ) THEN
          RAISE EXCEPTION 'Des triggers existent encore sur la table client_scores';
    END IF;

    IF to_regclass('public.client_scores_update') IS NOT NULL THEN
          RAISE EXCEPTION 'La table client_scores_update existe encore';
    END IF;

    IF to_regprocedure('evaluation.after_scores_write()') IS NOT NULL THEN
          RAISE EXCEPTION 'La fonction evaluation.after_scores_write existe encore';
    END IF;

    IF position('client_scores_update' in pg_get_functiondef('public.delete_collectivite_test(integer)'::regprocedure)) > 0 THEN
          RAISE EXCEPTION 'delete_collectivite_test référence encore client_scores_update';
    END IF;
END $$;

ROLLBACK;
