-- Deploy tet:plan_action/ai_plan_import_reprise to pg
-- requires: plan_action/fiche_secteur_origine_import_ia

BEGIN;

ALTER TABLE public.ai_plan_import_job
    ADD COLUMN checkpoint jsonb NULL,
    ADD COLUMN attempt integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.ai_plan_import_job.checkpoint IS
    'État de la pipeline après sa dernière étape terminée, pour reprendre l''import sans rappeler le modèle. Porte le texte découpé du document : vidé à la réussite, purgé sur les échecs.';
COMMENT ON COLUMN public.ai_plan_import_job.attempt IS
    'Passage en cours : 0 au premier, un de plus à chaque reprise. Une exécution n''écrit plus rien une fois qu''un passage plus récent l''a remplacée.';

ALTER TABLE public.ai_plan_import_step_run
    ADD COLUMN attempt integer NOT NULL DEFAULT 0,
    DROP CONSTRAINT ai_plan_import_step_run_job_step_unique,
    ADD CONSTRAINT ai_plan_import_step_run_job_step_attempt_unique
        UNIQUE (job_id, step, attempt);

COMMENT ON COLUMN public.ai_plan_import_step_run.attempt IS
    'Passage de l''import pendant lequel l''étape a tourné : 0 au premier, puis un de plus à chaque reprise. Une étape rejouée garde la trace du passage précédent.';

COMMIT;
