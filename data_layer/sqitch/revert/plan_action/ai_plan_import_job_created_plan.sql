-- Revert tet:plan_action/ai_plan_import_job_created_plan from pg

BEGIN;

ALTER TABLE public.ai_plan_import_job
    DROP COLUMN IF EXISTS created_plan_id;

COMMIT;
