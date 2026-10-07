-- Verify tet:demarche/pcaet_bilan_renouvellement on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT requis
           AND etape = 'amont'
           AND expr_applicable = 'demarche(renouvellement)'
        FROM public.demarche_document_definition
        WHERE id = 'pcaet_bilan_pcaet_precedent'
    ), 'Le bilan du PCAET précédent doit être requis, en amont, et réservé aux renouvellements';

    -- Le bilan évalue un dossier clos : aucune pièce du dépôt en cours ne le
    -- contient, donc aucune substitution, donc aucune case à cocher.
    ASSERT (
        SELECT count(*) = 0
        FROM public.demarche_document_substitution
        WHERE document_id = 'pcaet_bilan_pcaet_precedent'
    ), 'Le bilan ne doit pouvoir être déclaré compris dans aucune autre pièce';

    -- Trois pièces conditionnelles désormais : les deux plans annexes et le bilan.
    ASSERT (
        SELECT count(*) = 3 FROM public.demarche_document_definition
        WHERE demarche_type = 'pcaet' AND expr_applicable IS NOT NULL
    ), 'Le catalogue PCAET doit compter exactement trois pièces conditionnelles';
END $$;

ROLLBACK;
