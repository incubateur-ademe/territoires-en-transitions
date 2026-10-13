-- Verify tet:plan_action/ai_plan_import_reprise on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ai_plan_import_job'
          AND column_name = 'checkpoint'
          AND data_type = 'jsonb'
          AND is_nullable = 'YES'
    ), 'ai_plan_import_job doit porter checkpoint (jsonb, NULLABLE)';

    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ai_plan_import_job'
          AND column_name = 'attempt'
          AND is_nullable = 'NO'
          AND column_default = '0'
    ), 'ai_plan_import_job doit porter attempt, NOT NULL DEFAULT 0';

    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ai_plan_import_step_run'
          AND column_name = 'attempt'
          AND is_nullable = 'NO'
          AND column_default = '0'
    ), 'ai_plan_import_step_run doit porter attempt, NOT NULL DEFAULT 0';

    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'ai_plan_import_step_run'
          AND constraint_name = 'ai_plan_import_step_run_job_step_attempt_unique'
          AND constraint_type = 'UNIQUE'
    ), 'Une étape est unique par job et par passage';

    ASSERT (
        SELECT COUNT(*) = 0
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'ai_plan_import_step_run'
          AND constraint_name = 'ai_plan_import_step_run_job_step_unique'
    ), 'L''ancienne unicité par étape ne doit plus exister';
END $$;

ROLLBACK;
