-- Revert tet:plan_action/ai_plan_import_job_confirm from pg

BEGIN;

DROP INDEX IF EXISTS public.ai_plan_import_job_confirmed_plan_id_unique;

ALTER TABLE public.ai_plan_import_job
    DROP COLUMN IF EXISTS confirmed_plan_id;

COMMIT;
