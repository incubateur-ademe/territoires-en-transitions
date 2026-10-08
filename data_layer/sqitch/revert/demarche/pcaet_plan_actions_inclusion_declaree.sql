-- Revert tet:demarche/pcaet_plan_actions_inclusion_declaree from pg

BEGIN;

UPDATE public.demarche_document_substitution
SET automatic = true
WHERE document_id = 'pcaet_plan_actions'
  AND substitut_id = 'pcaet_document_global';

COMMIT;
