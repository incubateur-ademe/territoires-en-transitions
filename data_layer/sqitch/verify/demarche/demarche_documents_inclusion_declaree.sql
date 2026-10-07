-- Verify tet:demarche/demarche_documents_inclusion_declaree on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT array_agg(document_id ORDER BY document_id)
        FROM public.demarche_document_substitution
        WHERE substitut_id = 'pcaet_document_global' AND NOT automatic
    ) = ARRAY['pcaet_deliberation_arret', 'pcaet_etude_impact'],
        'Seules l''étude d''impact et la délibération d''arrêt se déclarent comprises dans le PCAET global';

    ASSERT (
        SELECT array_agg(document_id ORDER BY document_id)
        FROM public.demarche_document_substitution
        WHERE substitut_id = 'pcaet_document_global' AND automatic
    ) = ARRAY['pcaet_diagnostic', 'pcaet_dispositif_suivi_evaluation',
              'pcaet_plan_actions', 'pcaet_strategie_territoriale'],
        'Les quatre autres sections requises restent couvertes d''office par le PCAET global';

    ASSERT (
        SELECT nom = 'PCAET global'
           AND description = 'Document unique regroupant une partie des pièces obligatoires attendues.'
        FROM public.demarche_document_definition
        WHERE id = 'pcaet_document_global'
    ), 'La pièce globale doit s''intituler « PCAET global » et annoncer une couverture partielle';
END $$;

ROLLBACK;
