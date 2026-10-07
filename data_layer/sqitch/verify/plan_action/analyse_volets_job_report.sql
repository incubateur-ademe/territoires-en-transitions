-- Verify tet:plan_action/analyse_volets_job_report on pg

BEGIN;

DO
$$
    BEGIN
        ASSERT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'analyse_volets_job'
              AND column_name = 'report'
              AND data_type = 'jsonb'
        ), 'La colonne report doit exister en jsonb sur analyse_volets_job';

        ASSERT NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'analyse_volets_job'
              AND column_name = 'draft'
        ), 'L''ancienne colonne draft ne doit plus exister';

        ASSERT (
            SELECT col_description('public.analyse_volets_job'::regclass, ordinal_position)
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'analyse_volets_job'
              AND column_name = 'report'
        ) LIKE 'Compte rendu de la classification%',
            'Le commentaire de report doit decrire un compte rendu, pas une proposition';
    END
$$;

ROLLBACK;
