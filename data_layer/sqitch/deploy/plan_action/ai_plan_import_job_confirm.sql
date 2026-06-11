-- Deploy tet:plan_action/ai_plan_import_job_confirm to pg
-- requires: plan_action/ai_plan_import_job

BEGIN;

ALTER TABLE public.ai_plan_import_job
    DROP CONSTRAINT ai_plan_import_job_status_check,
    ADD CONSTRAINT ai_plan_import_job_status_check
        CHECK (status IN ('pending', 'running', 'done', 'failed', 'confirming'));

ALTER TABLE public.ai_plan_import_job
    ADD COLUMN confirmed_plan_id integer NULL
        REFERENCES public.axe(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.ai_plan_import_job.confirmed_plan_id IS
    'Plan (axe racine) créé à la confirmation du brouillon ; rend le confirm idempotent. NULL tant que non confirmé.';

CREATE UNIQUE INDEX ai_plan_import_job_confirmed_plan_id_unique
    ON public.ai_plan_import_job (confirmed_plan_id)
    WHERE confirmed_plan_id IS NOT NULL;

COMMIT;
