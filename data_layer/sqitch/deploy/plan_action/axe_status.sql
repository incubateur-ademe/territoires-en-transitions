-- Deploy tet:plan_action/axe_status to pg
-- requires: plan_action/axe_source_verification
-- requires: plan_action/ai_plan_import_job_created_plan

BEGIN;

ALTER TABLE public.axe
    ADD COLUMN status text NOT NULL DEFAULT 'active'
        CONSTRAINT axe_status_check CHECK (status IN ('importing', 'to_verify', 'active', 'failed'));

COMMENT ON COLUMN public.axe.status IS
    'Cycle de vie du plan (axe racine) : importing pendant l''import IA, to_verify une fois importé, active après vérification ou création à la main, failed si l''import a échoué.';

UPDATE public.axe
SET status = 'to_verify'
WHERE parent IS NULL
  AND source = 'import_ia'
  AND verified_at IS NULL;

ALTER TABLE public.ai_plan_import_job
    ADD COLUMN fichier_id integer NULL
        REFERENCES labellisation.bibliotheque_fichier(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.ai_plan_import_job.fichier_id IS
    'Document importé, rangé dans la bibliothèque de la collectivité : repère un ré-import du même fichier.';

CREATE INDEX ai_plan_import_job_collectivite_fichier_idx
    ON public.ai_plan_import_job (collectivite_id, fichier_id)
    WHERE fichier_id IS NOT NULL;

COMMIT;
