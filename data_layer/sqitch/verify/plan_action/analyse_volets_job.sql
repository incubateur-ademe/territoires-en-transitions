-- Verify tet:plan_action/analyse_volets_job on pg

BEGIN;

DO
$$
    DECLARE
        contraintes_restantes text;
    BEGIN
        ASSERT to_regclass('public.analyse_volets_job') IS NOT NULL,
            'La table analyse_volets_job doit exister';

        ASSERT to_regclass('public.classification_volets_job') IS NULL,
            'L''ancien nom classification_volets_job ne doit plus exister';

        SELECT string_agg(conname, ', ' ORDER BY conname)
        INTO contraintes_restantes
        FROM pg_constraint
        WHERE conrelid = 'public.analyse_volets_job'::regclass
          AND conname LIKE 'classification\_%';

        ASSERT contraintes_restantes IS NULL,
            'Aucune contrainte ne doit garder l''ancien prefixe, or : ' || contraintes_restantes;

        ASSERT (
            SELECT count(*) = 5
            FROM pg_constraint
            WHERE conrelid = 'public.analyse_volets_job'::regclass
              AND conname LIKE 'analyse\_volets\_job\_%'
        ), 'Les cinq contraintes de la table doivent porter le nouveau prefixe';

        ASSERT (
            SELECT count(*) = 1
            FROM pg_indexes
            WHERE schemaname = 'public'
              AND tablename = 'analyse_volets_job'
              AND indexname = 'analyse_volets_job_in_flight_unique'
        ), 'L''index d''unicite in-flight doit porter le nouveau nom';
    END
$$;

ROLLBACK;
