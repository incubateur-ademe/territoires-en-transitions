-- Verify tet:plan_action/analysis_run on pg

BEGIN;

DO
$$
    BEGIN
        ASSERT (
            SELECT is_nullable = 'NO' AND column_default IS NULL
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'analysis_run'
              AND column_name = 'started_at'
        ), 'La date de debut doit etre fournie par le passage';

        ASSERT (
            SELECT is_nullable = 'NO' AND column_default = 'now()'
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'analysis_run'
              AND column_name = 'finished_at'
        ), 'La date de fin doit etre posee par la base';

        ASSERT (
            SELECT relrowsecurity
            FROM pg_class
            WHERE oid = 'public.analysis_run'::regclass
        ), 'La table doit avoir la RLS activee';

        ASSERT (
            SELECT COUNT(*) = 0
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'analysis_run'
        ), 'La table ne doit porter aucune policy : seul service_role y accede';
    END
$$;

ROLLBACK;
