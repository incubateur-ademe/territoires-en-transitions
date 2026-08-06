-- Verify tet:demarche/demarche_documents on pg

BEGIN;

DO $$
DECLARE
    portee_check text;
BEGIN
    -- Catalogue et substitutions.
    ASSERT (
        SELECT COUNT(*) = 10
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_document_definition'
          AND column_name IN ('id', 'demarche_type', 'nom', 'description', 'requis',
                              'ordre', 'portee', 'couverture_plateforme',
                              'created_at', 'modified_at')
    ), 'La table demarche_document_definition doit contenir les 10 colonnes attendues';

    SELECT cc.check_clause INTO portee_check
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = 'public'
      AND ccu.table_name = 'demarche_document_definition'
      AND ccu.column_name = 'portee'
    LIMIT 1;
    ASSERT portee_check IS NOT NULL, 'La colonne portee doit avoir une contrainte CHECK';
    ASSERT portee_check LIKE '%''global''%' AND portee_check LIKE '%''section''%',
        'La contrainte CHECK de portee doit contenir global et section';

    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_schema = 'public'
          AND ccu.table_name = 'demarche_document_definition'
          AND ccu.column_name = 'demarche_type'
    ), 'La colonne demarche_type doit avoir une contrainte CHECK (héritage par type)';

    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_schema = 'public'
          AND ccu.table_name = 'demarche_document_definition'
          AND ccu.column_name = 'couverture_plateforme'
    ), 'La colonne couverture_plateforme doit avoir une contrainte CHECK';

    -- Le modèle PCAET est seedé par la migration : sans lui la page est vide.
    ASSERT (
        SELECT COUNT(*) = 10 FROM public.demarche_document_definition
        WHERE demarche_type = 'pcaet'
    ), 'Le modèle documentaire du PCAET doit contenir 10 pièces (1 globale + 9 sections)';
    ASSERT (
        SELECT COUNT(*) = 1 FROM public.demarche_document_definition
        WHERE demarche_type = 'pcaet' AND portee = 'global'
    ), 'Le modèle PCAET doit contenir exactement une pièce de portée globale';
    ASSERT (
        SELECT COUNT(*) = 4 FROM public.demarche_document_definition
        WHERE demarche_type = 'pcaet' AND portee = 'section' AND requis
    ), 'Le modèle PCAET doit contenir 4 sections requises';
    ASSERT (
        SELECT COUNT(*) = 9 FROM public.demarche_document_substitution
        WHERE substitut_id = 'document_global'
    ), 'Le document global doit couvrir les 9 sections attendues';

    -- Pièces déposées : tronc commun preuve_base + rattachements.
    ASSERT (
        SELECT COUNT(*) = 11
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_document'
          AND column_name IN ('id', 'collectivite_id', 'fichier_id', 'url', 'titre', 'lien',
                              'commentaire', 'modified_by', 'modified_at',
                              'demarche_id', 'document_id')
    ), 'La table demarche_document doit contenir les 11 colonnes attendues';

    ASSERT (
        SELECT is_generated = 'ALWAYS'
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_document'
          AND column_name = 'lien'
    ), 'La colonne lien doit être générée (héritée de labellisation.preuve_base)';

    ASSERT (
        SELECT is_nullable = 'YES'
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_document'
          AND column_name = 'modified_by'
    ), 'La colonne modified_by doit être nullable (écriture en service_role)';

    ASSERT (
        SELECT COUNT(*) = 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'demarche_document_demarche_id_document_id_key'
    ), 'Une seule pièce par (demarche_id, document_id) : l''index unique doit exister';

    ASSERT (
        SELECT COUNT(*) = 5
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_document_couverture'
    ), 'La table demarche_document_couverture doit contenir les 5 colonnes attendues';

    -- RLS : lecture ouverte sur les tables de référence, deny-by-default sur les instances.
    ASSERT (
        SELECT bool_and(c.relrowsecurity)
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname IN ('demarche_document_definition',
                            'demarche_document_substitution',
                            'demarche_document',
                            'demarche_document_couverture')
    ), 'RLS doit être activée sur les 4 tables demarche_document*';

    ASSERT (
        SELECT COUNT(*) = 2
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('demarche_document_definition',
                            'demarche_document_substitution')
    ), 'Les tables de référence du catalogue doivent avoir une policy de lecture';

    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('demarche_document', 'demarche_document_couverture')
    ), 'Les pièces déposées ne doivent avoir aucune policy (accès service_role uniquement)';
END $$;

ROLLBACK;
