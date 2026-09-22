-- Verify tet:demarche/pcaet_plan_chaleur_froid_commune_membre on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT requis
           AND etape = 'both'
           AND expr_applicable = 'identite(soustype, epci_a_fiscalite_propre) et identite(commune_membre, plus_de_45000)'
        FROM public.demarche_document_definition
        WHERE id = 'pcaet_plan_chaleur_froid'
    ), 'Le plan local de chaleur et de froid doit être requis des seuls EPCI à fiscalité propre ayant une commune membre de plus de 45 000 habitants';

    -- La case « Inclus dans "Programme d'actions" » reste en place.
    ASSERT (
        SELECT count(*) = 1
        FROM public.demarche_document_substitution
        WHERE document_id = 'pcaet_plan_chaleur_froid'
          AND substitut_id = 'pcaet_plan_actions'
          AND NOT automatic
    ), 'Le plan local de chaleur et de froid doit rester déclarable comme compris dans le programme d''actions';

    -- Toujours trois pièces conditionnelles : les deux plans annexes et le bilan.
    ASSERT (
        SELECT count(*) = 3 FROM public.demarche_document_definition
        WHERE demarche_type = 'pcaet' AND expr_applicable IS NOT NULL
    ), 'Le catalogue PCAET doit compter exactement trois pièces conditionnelles';
END $$;

ROLLBACK;
