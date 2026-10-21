-- Verify tet:evaluation/drop_client_scores_dependances on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_depend d
        JOIN pg_rewrite r ON r.oid = d.objid
        WHERE d.refobjid IN ('public.client_scores'::regclass,
                             'public.pre_audit_scores'::regclass,
                             'public.post_audit_scores'::regclass)
    ) THEN
          RAISE EXCEPTION 'Des vues dépendent encore des anciennes tables de scores';
    END IF;

    IF to_regprocedure('labellisation.critere_action(integer)') IS NOT NULL THEN
          RAISE EXCEPTION 'La fonction labellisation.critere_action existe encore';
    END IF;

    IF to_regprocedure('public.delete_collectivite_test(integer)') IS NOT NULL THEN
          RAISE EXCEPTION 'La fonction delete_collectivite_test existe encore';
    END IF;

    IF to_regclass('cron.job') IS NOT NULL THEN
        IF EXISTS (SELECT FROM cron.job WHERE jobname = 'refresh_stats_completude') THEN
              RAISE EXCEPTION 'Le job cron refresh_stats_completude existe encore';
        END IF;
    END IF;
END $$;

ROLLBACK;
