-- Verify tet:demarche/pcaet_ees_absorbe_etude_impact on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT count(*) = 0 FROM public.demarche_document_definition
        WHERE id = 'pcaet_etude_impact'
    ), 'L''étude d''impact ne doit plus figurer au catalogue';

    ASSERT (
        SELECT count(*) = 0 FROM public.demarche_document
        WHERE document_id = 'pcaet_etude_impact'
    ), 'Aucun dépôt ne doit plus pointer l''étude d''impact';

    ASSERT (
        SELECT nom = 'EES (évaluation environnementale stratégique - dont résumé non technique)'
           AND requis
           AND etape = 'both'
        FROM public.demarche_document_definition
        WHERE id = 'pcaet_ees'
    ), 'L''EES doit porter son nom complet, être requise et révisable après les avis';

    -- L'inclusion dans le PCAET global se déclare, elle n'est pas d'office.
    ASSERT (
        SELECT count(*) = 1 FROM public.demarche_document_substitution
        WHERE document_id = 'pcaet_ees'
          AND substitut_id = 'pcaet_document_global'
          AND NOT automatic
    ), 'L''EES doit pouvoir être déclarée comprise dans le PCAET global';

    -- Chronologie resserrée : une pièce de moins, sans trou ni doublon.
    ASSERT (
        SELECT array_agg(id ORDER BY ordre) = ARRAY[
            'pcaet_document_global',
            'pcaet_deliberation_engagement',
            'pcaet_diagnostic',
            'pcaet_strategie_territoriale',
            'pcaet_plan_actions',
            'pcaet_plan_qualite_air',
            'pcaet_plan_chaleur_froid',
            'pcaet_dispositif_suivi_evaluation',
            'pcaet_ees',
            'pcaet_bilan_pcaet_precedent',
            'pcaet_deliberation_arret',
            'pcaet_memoire_reponse_avis',
            'pcaet_synthese_consultation_publique',
            'pcaet_deliberation_adoption'
        ]
        FROM public.demarche_document_definition
        WHERE demarche_type = 'pcaet'
    ), 'Le catalogue PCAET doit compter 14 pièces, l''EES à la place de l''étude d''impact';
END $$;

ROLLBACK;
