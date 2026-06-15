-- Deploy tet:plan_action/ai_plan_import_job_created_plan to pg
-- requires: plan_action/ai_plan_import_job

BEGIN;

ALTER TABLE public.ai_plan_import_job
    ADD COLUMN created_plan_id integer NULL
        REFERENCES public.axe(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.ai_plan_import_job.created_plan_id IS
    'Plan (axe racine) créé par le worker à partir du brouillon ; NULL tant que non créé. Lien de traçabilité exposé par get-import-status (redirection vers le plan).';

COMMIT;
