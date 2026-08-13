-- Deploy tet:demarche/pcaet_documents_aval to pg
-- requires: demarche/demarche_documents_etape

BEGIN;

-- Le mémoire de réponse aux avis institutionnels et la synthèse de la
-- consultation publique n'existent qu'une fois les avis rendus : ils rejoignent
-- la délibération d'adoption à l'étape aval. L'ordre d'affichage est déjà celui
-- de la chronologie (réponse aux avis, synthèse, délibération), on n'y touche pas.
UPDATE public.demarche_document_definition
SET etape       = 'aval',
    modified_at = now()
WHERE id IN ('pcaet_memoire_reponse_avis',
             'pcaet_synthese_consultation_publique');

-- Le document global regroupe le dossier d'élaboration : son dépôt ne peut pas
-- couvrir une pièce postérieure aux avis.
DELETE FROM public.demarche_document_substitution
WHERE document_id IN (
    SELECT id FROM public.demarche_document_definition WHERE etape = 'aval'
);

COMMIT;
