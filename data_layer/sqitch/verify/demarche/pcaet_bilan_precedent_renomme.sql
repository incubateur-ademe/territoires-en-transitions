-- Verify tet:demarche/pcaet_bilan_precedent_renomme on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT nom = 'Bilan du PCAET précédent'
        FROM public.demarche_document_definition
        WHERE id = 'pcaet_bilan_pcaet_precedent'
    ), 'La pièce pcaet_bilan_pcaet_precedent doit s''intituler « Bilan du PCAET précédent »';
END $$;

ROLLBACK;
