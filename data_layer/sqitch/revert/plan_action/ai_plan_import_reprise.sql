-- Revert tet:plan_action/ai_plan_import_reprise from pg

BEGIN;

-- L'unicité par étape revient : seul le premier passage de chaque étape reste.
ALTER TABLE public.ai_plan_import_step_run
    DROP CONSTRAINT IF EXISTS ai_plan_import_step_run_job_step_attempt_unique;

DELETE FROM public.ai_plan_import_step_run later
USING public.ai_plan_import_step_run earlier
WHERE later.job_id = earlier.job_id
  AND later.step = earlier.step
  AND later.attempt > earlier.attempt;

ALTER TABLE public.ai_plan_import_step_run
    ADD CONSTRAINT ai_plan_import_step_run_job_step_unique UNIQUE (job_id, step),
    DROP COLUMN IF EXISTS attempt;

ALTER TABLE public.ai_plan_import_job
    DROP COLUMN IF EXISTS attempt,
    DROP COLUMN IF EXISTS checkpoint;

COMMIT;
