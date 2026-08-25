-- Revert tet:demarche/pcaet_programme_actions from pg

BEGIN;

UPDATE public.demarche_document_definition
SET nom         = 'Plan d''actions',
    modified_at = now()
WHERE id = 'pcaet_plan_actions';

COMMIT;
