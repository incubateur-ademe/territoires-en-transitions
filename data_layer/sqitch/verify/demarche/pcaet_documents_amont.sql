-- Verify tet:demarche/pcaet_documents_amont on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT COUNT(*) = 13 FROM public.demarche_document_definition
        WHERE demarche_type = 'pcaet'
    ), 'Le modèle PCAET doit contenir 13 pièces (1 globale + 9 sections amont + 3 aval)';
    ASSERT (
        SELECT COUNT(*) = 9 FROM public.demarche_document_definition
        WHERE demarche_type = 'pcaet' AND portee = 'section' AND etape = 'amont'
    ), 'Le dossier d''élaboration doit compter 9 sections';

    -- Les trois pièces ajoutées : deux délibérations et l'étude d'impact.
    ASSERT (
        SELECT NOT requis AND etape = 'amont'
        FROM public.demarche_document_definition
        WHERE id = 'pcaet_deliberation_engagement'
    ), 'La délibération d''engagement doit être une pièce amont optionnelle';
    ASSERT (
        SELECT requis AND etape = 'amont'
        FROM public.demarche_document_definition
        WHERE id = 'pcaet_etude_impact'
    ), 'L''étude d''impact doit être une pièce amont requise';
    ASSERT (
        SELECT requis AND etape = 'amont'
        FROM public.demarche_document_definition
        WHERE id = 'pcaet_deliberation_arret'
    ), 'La délibération d''arrêt doit être une pièce amont requise';

    -- L'ordre d'affichage suit la chronologie, sans doublon ni trou.
    ASSERT (
        SELECT array_agg(id ORDER BY ordre) = ARRAY[
            'pcaet_document_global',
            'pcaet_deliberation_engagement',
            'pcaet_diagnostic',
            'pcaet_strategie_territoriale',
            'pcaet_plan_actions',
            'pcaet_dispositif_suivi_evaluation',
            'pcaet_ees',
            'pcaet_etude_impact',
            'pcaet_bilan_pcaet_precedent',
            'pcaet_deliberation_arret',
            'pcaet_memoire_reponse_avis',
            'pcaet_synthese_consultation_publique',
            'pcaet_deliberation_adoption'
        ]
        FROM public.demarche_document_definition
        WHERE demarche_type = 'pcaet'
    ), 'Le catalogue PCAET doit suivre la chronologie de la démarche';

    -- Périmètre du document global : les sections requises de l'élaboration.
    ASSERT (
        SELECT array_agg(document_id ORDER BY document_id) = ARRAY[
            'pcaet_deliberation_arret',
            'pcaet_diagnostic',
            'pcaet_dispositif_suivi_evaluation',
            'pcaet_etude_impact',
            'pcaet_plan_actions',
            'pcaet_strategie_territoriale'
        ]
        FROM public.demarche_document_substitution
        WHERE substitut_id = 'pcaet_document_global'
    ), 'Le document global doit couvrir les 6 sections amont requises, et elles seules';
    ASSERT (
        SELECT COUNT(*) = 0
        FROM public.demarche_document_substitution substitution
        JOIN public.demarche_document_definition definition
          ON definition.id = substitution.document_id
        WHERE definition.etape = 'aval' OR NOT definition.requis
    ), 'Aucune pièce aval ni optionnelle ne doit être couverte par substitution';
END $$;

ROLLBACK;
