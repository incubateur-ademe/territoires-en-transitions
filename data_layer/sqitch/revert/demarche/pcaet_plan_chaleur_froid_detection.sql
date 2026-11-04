-- Revert tet:demarche/pcaet_plan_chaleur_froid_detection from pg

BEGIN;

DROP TABLE public.demarche_document_detection;

-- Les déclarations du PLCF ne pouvaient viser que le programme d'actions.
DELETE FROM public.demarche_document_substitution
WHERE document_id = 'pcaet_plan_chaleur_froid'
  AND substitut_id IN ('pcaet_diagnostic', 'pcaet_strategie_territoriale');

ALTER TABLE public.demarche_document_substitution
    DROP COLUMN is_detection_required;

COMMIT;
