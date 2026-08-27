-- Deploy tet:demarche/pcaet_bilan_precedent_renomme to pg
-- requires: demarche/demarche_documents_portee_both

BEGIN;

-- « Bilan de la démarche précédente » ne dit pas de quelle démarche il s'agit :
-- la pièce attendue est le bilan du PCAET qui s'achève, et elle ne concerne que
-- les collectivités en renouvellement. L'identifiant ne bouge pas : il est
-- porté par le code et les tests.
UPDATE public.demarche_document_definition
SET nom         = 'Bilan du PCAET précédent',
    modified_at = now()
WHERE id = 'pcaet_bilan_pcaet_precedent';

COMMIT;
