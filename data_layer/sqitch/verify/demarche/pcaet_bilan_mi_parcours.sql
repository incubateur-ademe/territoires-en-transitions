-- Verify tet:demarche/pcaet_bilan_mi_parcours on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT nom = 'Bilan à mi-parcours du PCAET précédent'
           AND NOT requis
           AND etape = 'amont'
           AND expr_applicable = 'demarche(renouvellement)'
        FROM public.demarche_document_definition
        WHERE id = 'pcaet_bilan_mi_parcours_precedent'
    ), 'Le bilan à mi-parcours doit être facultatif, en amont, et réservé aux renouvellements';

    ASSERT (
        SELECT count(*) = 0
        FROM public.demarche_document_substitution
        WHERE document_id = 'pcaet_bilan_mi_parcours_precedent'
    ), 'Le bilan à mi-parcours ne doit pouvoir être déclaré compris dans aucune autre pièce';

    -- Les deux bilans ouvrent le dossier ; le PCAET global, retiré, garde son rang 0.
    ASSERT (
        SELECT array_agg(id ORDER BY ordre) = ARRAY[
            'pcaet_document_global',
            'pcaet_bilan_pcaet_precedent',
            'pcaet_bilan_mi_parcours_precedent',
            'pcaet_deliberation_engagement',
            'pcaet_diagnostic',
            'pcaet_strategie_territoriale',
            'pcaet_plan_actions',
            'pcaet_plan_qualite_air',
            'pcaet_plan_chaleur_froid',
            'pcaet_dispositif_suivi_evaluation',
            'pcaet_ees',
            'pcaet_deliberation_arret',
            'pcaet_memoire_reponse_avis',
            'pcaet_synthese_consultation_publique',
            'pcaet_deliberation_adoption'
        ]
        FROM public.demarche_document_definition
        WHERE demarche_type = 'pcaet'
    ), 'Le catalogue PCAET doit s''ouvrir sur les bilans du PCAET précédent';
END $$;

ROLLBACK;
