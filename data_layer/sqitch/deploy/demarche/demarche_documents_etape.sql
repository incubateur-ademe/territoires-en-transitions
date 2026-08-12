-- Deploy tet:demarche/demarche_documents_etape to pg
-- requires: demarche/demarche_documents

BEGIN;

-- ===========================================================================
-- 1. Étape du cycle de vie à laquelle chaque pièce est attendue : amont
--    (dossier d'élaboration, exigée pour la transmission) ou aval (produite
--    après les avis, exigée pour la publication).
-- ===========================================================================
ALTER TABLE public.demarche_document_definition
    ADD COLUMN etape text NOT NULL DEFAULT 'amont'
        CHECK (etape IN ('amont', 'aval'));

COMMENT ON COLUMN public.demarche_document_definition.etape IS
    'amont = pièce du dossier d''élaboration, exigée pour la transmission pour avis ; aval = pièce produite après les avis (ex. délibération d''adoption), exigée pour la publication quand elle est requise.';

-- ===========================================================================
-- 2. La délibération d'adoption est produite après les avis : elle passe en
--    aval, devient requise (elle conditionne désormais la publication, pas la
--    transmission) et est renvoyée en fin de catalogue.
-- ===========================================================================
UPDATE public.demarche_document_definition
SET etape       = 'aval',
    nom         = 'Délibération d''adoption du PCAET',
    requis      = true,
    ordre       = 10,
    modified_at = now()
WHERE id = 'pcaet_deliberation_adoption';

-- Le document global regroupe le dossier d'élaboration : son dépôt ne peut pas
-- couvrir une pièce postérieure aux avis.
DELETE FROM public.demarche_document_substitution
WHERE document_id IN (
    SELECT id FROM public.demarche_document_definition WHERE etape = 'aval'
);

COMMIT;
