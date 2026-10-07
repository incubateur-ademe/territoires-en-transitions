-- Verify tet:demarche/demarche_documents_additional on pg

BEGIN;

DO $$
BEGIN
    -- Configuration du type de démarche.
    ASSERT (
        SELECT COUNT(*) = 7
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_definition'
          AND column_name IN ('demarche_type', 'documents_additional_amont',
                              'documents_additional_aval', 'documents_formats_autorises',
                              'documents_mime_types_autorises',
                              'created_at', 'modified_at')
    ), 'La table demarche_definition doit contenir les 7 colonnes attendues';

    ASSERT (
        SELECT COUNT(*) = 2
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_definition'
          AND column_name IN ('documents_formats_autorises',
                              'documents_mime_types_autorises')
          AND data_type = 'ARRAY'
    ), 'Les formats autorisés doivent être des tableaux (NULL = aucune restriction)';

    -- Le PCAET est configuré par cette migration : sans sa ligne, les pièces
    -- additionnelles seraient fermées et les formats non restreints.
    ASSERT (
        SELECT documents_additional_amont AND documents_additional_aval
        FROM public.demarche_definition WHERE demarche_type = 'pcaet'
    ), 'Le PCAET doit autoriser le dépôt de pièces additionnelles en amont et en aval';
    ASSERT (
        SELECT documents_formats_autorises = ARRAY['pdf']
           AND documents_mime_types_autorises = ARRAY['application/pdf']
        FROM public.demarche_definition WHERE demarche_type = 'pcaet'
    ), 'Le dossier PCAET ne doit accepter que des PDF';

    -- Pièces additionnelles : tronc commun preuve_base + rattachement à l'étape.
    ASSERT (
        SELECT COUNT(*) = 11
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_document_additional'
          AND column_name IN ('id', 'collectivite_id', 'fichier_id', 'url', 'titre',
                              'lien', 'commentaire', 'modified_by', 'modified_at',
                              'demarche_id', 'etape')
    ), 'La table demarche_document_additional doit contenir les 11 colonnes attendues';

    -- Titre facultatif : la ligne s'ouvre sans nom, à la valeur par défaut
    -- héritée de preuve_base (chaîne vide), pas à NULL.
    ASSERT (
        SELECT is_nullable = 'NO' AND column_default = '''''::text'
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_document_additional'
          AND column_name = 'titre'
    ), 'Le titre d''une pièce additionnelle doit être vide par défaut, comme dans preuve_base';

    ASSERT (
        SELECT is_nullable = 'YES'
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_document_additional'
          AND column_name = 'modified_by'
    ), 'La colonne modified_by doit être nullable (écriture en service_role)';

    -- La ligne s'ouvre avant le titre et avant le dépôt : elle doit pouvoir
    -- exister sans fichier ni lien.
    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_constraint
        WHERE conrelid = 'public.demarche_document_additional'::regclass
          AND conname = 'preuve_base_check'
    ), 'Le CHECK XOR hérité de preuve_base doit avoir été remplacé';
    ASSERT (
        SELECT COUNT(*) = 1
        FROM pg_constraint
        WHERE conrelid = 'public.demarche_document_additional'::regclass
          AND conname = 'demarche_document_additional_fichier_ou_lien'
    ), 'Une pièce additionnelle doit pouvoir exister sans fichier (ligne ouverte, dépôt à venir)';

    -- Plusieurs pièces additionnelles par étape : aucune unicité ne doit l'empêcher.
    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'demarche_document_additional'
          AND indexdef LIKE '%UNIQUE%'
          AND indexname <> 'demarche_document_additional_pkey'
    ), 'Aucun index unique ne doit limiter le nombre de pièces additionnelles';
    ASSERT (
        SELECT COUNT(*) = 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'demarche_document_additional_demarche_id_etape_idx'
    ), 'Les pièces additionnelles doivent être indexées par (demarche_id, etape)';

    -- RLS : lecture ouverte sur la définition du type, deny-by-default sur les
    -- pièces déposées.
    ASSERT (
        SELECT bool_and(c.relrowsecurity)
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname IN ('demarche_definition', 'demarche_document_additional')
    ), 'RLS doit être activée sur les 2 nouvelles tables';
    ASSERT (
        SELECT COUNT(*) = 1
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'demarche_definition'
    ), 'La définition du type de démarche doit avoir une policy de lecture';
    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'demarche_document_additional'
    ), 'Les pièces additionnelles ne doivent avoir aucune policy (accès service_role uniquement)';
END $$;

ROLLBACK;
