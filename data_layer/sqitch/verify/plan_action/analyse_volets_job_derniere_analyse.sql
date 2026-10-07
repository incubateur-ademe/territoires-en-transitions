-- Verify tet:plan_action/analyse_volets_job_derniere_analyse on pg

BEGIN;

DO
$$
    DECLARE
        definition text;
    BEGIN
        SELECT indexdef
        INTO definition
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'analyse_volets_job'
          AND indexname = 'analyse_volets_job_derniere_analyse';

        ASSERT definition IS NOT NULL,
            'L''index analyse_volets_job_derniere_analyse doit exister';

        ASSERT strpos(
                   definition,
                   'collectivite_id, enjeu, created_at DESC, id DESC'
               ) > 0,
            'L''index doit porter la collectivite, l''enjeu, puis la date decroissante, or : ' ||
            definition;
    END
$$;

ROLLBACK;
