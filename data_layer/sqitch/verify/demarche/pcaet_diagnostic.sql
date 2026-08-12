-- Verify tet:demarche/pcaet_diagnostic on pg

BEGIN;

DO $$
DECLARE
    kind_check text;
BEGIN
    ASSERT (
        SELECT COUNT(*) = 12
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_pcaet_topic'
          AND column_name IN ('id', 'code', 'label', 'icon', 'kind', 'group_label',
                              'row_label', 'unit', 'referentiel_id', 'horizons',
                              'display_order', 'created_at')
    ), 'La table demarche_pcaet_topic doit contenir les colonnes attendues';

    SELECT cc.check_clause INTO kind_check
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = 'public' AND ccu.table_name = 'demarche_pcaet_topic'
      AND ccu.column_name = 'kind'
    LIMIT 1;
    ASSERT kind_check IS NOT NULL, 'La colonne kind doit avoir une contrainte CHECK';
    ASSERT kind_check LIKE '%''indicateurs''%' AND kind_check LIKE '%''vulnerabilite''%',
        'La contrainte CHECK de kind doit lister indicateurs et vulnerabilite';

    ASSERT (
        SELECT COUNT(*) = 7
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_pcaet_topic_row'
          AND column_name IN ('id', 'topic_id', 'parent_id', 'label',
                              'referentiel_id', 'requis', 'display_order')
    ), 'La table demarche_pcaet_topic_row doit contenir les colonnes attendues';

    ASSERT (
        SELECT COUNT(*) = 4
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_pcaet_diagnostic_state'
          AND column_name IN ('demarche_id', 'topic_id', 'reference_year', 'extra_years')
    ), 'La table demarche_pcaet_diagnostic_state doit porter la clé, l''année de comptabilisation et les années ajoutées';

    ASSERT (
        SELECT COUNT(*) = 4
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_pcaet_diagnostic_snapshot'
          AND column_name IN ('demarche_id', 'jalon', 'date', 'payload')
    ), 'La table demarche_pcaet_diagnostic_snapshot doit porter le jalon, la date et le payload';

    -- Le référentiel est seedé par la migration : sans lui l'écran est vide.
    ASSERT (SELECT COUNT(*) = 6 FROM public.demarche_pcaet_topic),
        'Les 6 topics du diagnostic doivent être seedés';
    ASSERT (SELECT COUNT(*) = 100 FROM public.demarche_pcaet_topic_row),
        'Les 100 lignes du diagnostic doivent être seedées';

    ASSERT (
        SELECT bool_and(c.relrowsecurity)
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname IN ('demarche_pcaet_topic', 'demarche_pcaet_topic_row',
                            'demarche_pcaet_diagnostic_state',
                            'demarche_pcaet_diagnostic_snapshot')
    ), 'RLS doit être activée sur les 4 tables du diagnostic';

    -- Référentiel en lecture ouverte, état et photo réservés au service_role.
    ASSERT (
        SELECT COUNT(*) = 2
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('demarche_pcaet_topic', 'demarche_pcaet_topic_row')
    ), 'Le référentiel du diagnostic doit être lisible (une policy allow_read par table)';

    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('demarche_pcaet_diagnostic_state',
                            'demarche_pcaet_diagnostic_snapshot')
    ), 'L''état et la photo du diagnostic ne doivent avoir aucune policy (accès service_role uniquement)';
END $$;

ROLLBACK;
