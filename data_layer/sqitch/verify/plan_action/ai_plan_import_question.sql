-- Verify tet:plan_action/ai_plan_import_question on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ai_plan_import_job'
          AND column_name = 'question'
          AND data_type = 'jsonb'
          AND is_nullable = 'YES'
    ), 'ai_plan_import_job doit porter question (jsonb, NULLABLE)';

    ASSERT (
        SELECT pg_get_constraintdef(oid) LIKE '%awaiting_answer%'
        FROM pg_constraint
        WHERE conrelid = 'public.ai_plan_import_job'::regclass
          AND conname = 'ai_plan_import_job_status_check'
    ), 'Le statut awaiting_answer doit être admis';

    ASSERT (
        SELECT i.indisunique
           AND i.indisvalid
           AND pg_get_indexdef(i.indexrelid, 1, true) = 'collectivite_id'
           AND pg_get_expr(i.indpred, i.indrelid) LIKE '%pending%'
           AND pg_get_expr(i.indpred, i.indrelid) LIKE '%running%'
           AND pg_get_expr(i.indpred, i.indrelid) LIKE '%awaiting_answer%'
        FROM pg_index i
        WHERE i.indexrelid = 'public.ai_plan_import_job_in_flight_unique'::regclass
    ), 'Un import qui attend une réponse occupe sa collectivité';
END $$;

ROLLBACK;
