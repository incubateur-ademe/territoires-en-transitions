-- Revert tet:plan_action/axe_status from pg

BEGIN;

DROP INDEX IF EXISTS public.ai_plan_import_job_collectivite_fichier_idx;

ALTER TABLE public.ai_plan_import_job
    DROP COLUMN IF EXISTS fichier_id;

ALTER TABLE public.axe
    DROP COLUMN IF EXISTS status;

COMMIT;
