-- Revert tet:demarche/pcaet_deliberation_arret_revisable from pg

BEGIN;

-- Une pièce de la seule élaboration n'a pas de version après les avis : celles
-- déposées entre-temps n'auraient plus de ligne où s'afficher.
DELETE FROM public.demarche_document
WHERE document_id = 'pcaet_deliberation_arret'
  AND etape = 'aval';

UPDATE public.demarche_document_definition
SET etape       = 'amont',
    modified_at = now()
WHERE id = 'pcaet_deliberation_arret';

COMMIT;
