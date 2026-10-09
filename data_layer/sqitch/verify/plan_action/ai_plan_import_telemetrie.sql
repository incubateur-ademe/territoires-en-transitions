-- Verify tet:plan_action/ai_plan_import_telemetrie on pg

BEGIN;

DO $$
DECLARE
    fk_job text;
BEGIN
    ASSERT (
        SELECT COUNT(*) = 3
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ai_plan_import_job'
          AND column_name IN ('started_at', 'finished_at', 'stats')
          AND is_nullable = 'YES'
    ), 'ai_plan_import_job doit porter started_at, finished_at et stats, NULLABLE';

    ASSERT (
        SELECT COUNT(*) = 14
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ai_plan_import_step_run'
    ), 'La table ai_plan_import_step_run doit contenir 14 colonnes';

    SELECT rc.delete_rule INTO fk_job
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
        USING (constraint_schema, constraint_name)
    JOIN information_schema.key_column_usage kcu
        USING (constraint_schema, constraint_name)
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'ai_plan_import_step_run'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'job_id'
    LIMIT 1;

    ASSERT fk_job = 'CASCADE',
        'La FK job_id doit avoir delete_rule = CASCADE';

    ASSERT (
        SELECT relrowsecurity
        FROM pg_class
        WHERE oid = 'public.ai_plan_import_step_run'::regclass
    ), 'La RLS doit être activée sur ai_plan_import_step_run';

    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'ai_plan_import_step_run'
    ), 'ai_plan_import_step_run ne doit avoir aucune policy';
END $$;

ROLLBACK;
