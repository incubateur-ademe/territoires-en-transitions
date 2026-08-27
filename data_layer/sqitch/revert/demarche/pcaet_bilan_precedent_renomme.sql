-- Revert tet:demarche/pcaet_bilan_precedent_renomme from pg

BEGIN;

UPDATE public.demarche_document_definition
SET nom         = 'Bilan de la démarche précédente',
    modified_at = now()
WHERE id = 'pcaet_bilan_pcaet_precedent';

COMMIT;
