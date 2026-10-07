-- Revert tet:demarche/pcaet_bilan_renouvellement from pg

BEGIN;

-- La pièce redevient optionnelle et attendue de tous. Les dépôts déjà faits
-- restent en place : la définition n'est pas supprimée. Elle n'avait pas de
-- substitution avant ce change et n'en retrouve donc aucune.
UPDATE public.demarche_document_definition
SET requis          = false,
    expr_applicable = NULL,
    modified_at     = now()
WHERE id = 'pcaet_bilan_pcaet_precedent';

COMMIT;
