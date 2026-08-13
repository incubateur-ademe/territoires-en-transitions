-- Verify tet:demarche/pcaet_documents_aval on pg

BEGIN;

DO $$
BEGIN
    -- Trois pièces sont produites après les avis : la délibération d'adoption,
    -- le mémoire de réponse aux avis et la synthèse de la consultation.
    ASSERT (
        SELECT COUNT(*) = 3 FROM public.demarche_document_definition
        WHERE demarche_type = 'pcaet' AND etape = 'aval'
    ), 'Le modèle PCAET doit contenir 3 pièces aval';
    ASSERT (
        SELECT bool_and(etape = 'aval')
        FROM public.demarche_document_definition
        WHERE id IN ('pcaet_memoire_reponse_avis',
                     'pcaet_synthese_consultation_publique')
    ), 'Le mémoire de réponse aux avis et la synthèse de la consultation doivent être des pièces aval';

    ASSERT (
        SELECT COUNT(*) = 0
        FROM public.demarche_document_substitution substitution
        JOIN public.demarche_document_definition definition
          ON definition.id = substitution.document_id
        WHERE definition.etape = 'aval'
    ), 'Le document global ne doit pas couvrir les pièces aval';
    ASSERT (
        SELECT COUNT(*) = 6 FROM public.demarche_document_substitution
        WHERE substitut_id = 'pcaet_document_global'
    ), 'Le document global doit couvrir les 6 sections amont restantes';
END $$;

ROLLBACK;
