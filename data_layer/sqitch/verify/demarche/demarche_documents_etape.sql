-- Verify tet:demarche/demarche_documents_etape on pg

BEGIN;

DO $$
DECLARE
    etape_check text;
BEGIN
    SELECT cc.check_clause INTO etape_check
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = 'public'
      AND ccu.table_name = 'demarche_document_definition'
      AND ccu.column_name = 'etape'
    LIMIT 1;
    ASSERT etape_check IS NOT NULL, 'La colonne etape doit avoir une contrainte CHECK';
    ASSERT etape_check LIKE '%''amont''%' AND etape_check LIKE '%''aval''%',
        'La contrainte CHECK de etape doit contenir amont et aval';

    -- La délibération d'adoption est la pièce aval du modèle PCAET : requise
    -- pour publier, hors du périmètre du document global.
    ASSERT (
        SELECT COUNT(*) = 1 FROM public.demarche_document_definition
        WHERE demarche_type = 'pcaet' AND etape = 'aval'
    ), 'Le modèle PCAET doit contenir exactement une pièce aval';
    ASSERT (
        SELECT requis AND etape = 'aval' AND nom = 'Délibération d''adoption du PCAET'
        FROM public.demarche_document_definition
        WHERE id = 'pcaet_deliberation_adoption'
    ), 'La délibération d''adoption doit être une pièce aval requise, renommée';
    ASSERT (
        SELECT COUNT(*) = 0
        FROM public.demarche_document_substitution substitution
        JOIN public.demarche_document_definition definition
          ON definition.id = substitution.document_id
        WHERE definition.etape = 'aval'
    ), 'Le document global ne doit plus couvrir les pièces aval';
    ASSERT (
        SELECT COUNT(*) = 8 FROM public.demarche_document_substitution
        WHERE substitut_id = 'pcaet_document_global'
    ), 'Le document global doit couvrir les 8 sections amont restantes';
END $$;

ROLLBACK;
