-- Revert tet:plan_action/ai_plan_import_telemetrie from pg

BEGIN;

DROP TABLE IF EXISTS public.ai_plan_import_step_run;

ALTER TABLE public.ai_plan_import_job
    DROP COLUMN IF EXISTS stats,
    DROP COLUMN IF EXISTS finished_at,
    DROP COLUMN IF EXISTS started_at;

COMMIT;
