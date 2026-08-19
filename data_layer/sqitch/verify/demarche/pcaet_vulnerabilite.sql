-- Verify tet:demarche/pcaet_vulnerabilite on pg

BEGIN;

DO $$
DECLARE
    niveau_check text;
BEGIN
    ASSERT (
        SELECT COUNT(*) = 6
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'demarche_pcaet_vulnerabilite_thematique'
          AND column_name IN ('id', 'code', 'label', 'collectivite_id',
                              'requis', 'display_order')
    ), 'La table demarche_pcaet_vulnerabilite_thematique doit contenir les colonnes attendues';

    ASSERT (
        SELECT COUNT(*) = 7
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'demarche_pcaet_vulnerabilite_valeur'
          AND column_name IN ('demarche_id', 'thematique_id', 'niveau_maintenant',
                              'niveau_2050', 'niveau_2100',
                              'objectifs_2050', 'objectifs_2100')
    ), 'La table demarche_pcaet_vulnerabilite_valeur doit porter la clé, les trois niveaux et les deux objectifs';

    SELECT cc.check_clause INTO niveau_check
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = 'public'
      AND ccu.table_name = 'demarche_pcaet_vulnerabilite_valeur'
      AND ccu.column_name = 'niveau_2050'
    LIMIT 1;
    ASSERT niveau_check IS NOT NULL,
        'La colonne niveau_2050 doit avoir une contrainte CHECK';
    ASSERT niveau_check LIKE '%''non_concerne''%'
       AND niveau_check LIKE '%''faible''%'
       AND niveau_check LIKE '%''moyen''%'
       AND niveau_check LIKE '%''fort''%',
        'La contrainte CHECK des niveaux doit lister non_concerne, faible, moyen et fort';

    -- Une thématique ajoutée n'a pas de code, une thématique du socle en a un.
    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.check_constraints
        WHERE constraint_schema = 'public'
          AND constraint_name = 'demarche_pcaet_vulnerabilite_thematique_code_socle_check'
    ), 'Le lien entre code et appartenance au socle doit être contraint';

    ASSERT (
        SELECT COUNT(*) = 2
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname IN ('demarche_pcaet_vulnerabilite_thematique_code_key',
                            'demarche_pcaet_vulnerabilite_thematique_collectivite_label_key')
    ), 'Les index d''unicité du socle et des thématiques ajoutées doivent exister';

    -- Le socle est seedé par la migration : sans lui le tableau est vide.
    -- Recadré à 9 thématiques par pcaet_vulnerabilite_thematique_socle_recadre.
    ASSERT (
        SELECT COUNT(*) = 9
        FROM public.demarche_pcaet_vulnerabilite_thematique
        WHERE collectivite_id IS NULL
    ), 'Les 9 thématiques du socle doivent être seedées';

    ASSERT (
        SELECT bool_and(requis)
        FROM public.demarche_pcaet_vulnerabilite_thematique
        WHERE collectivite_id IS NULL
    ), 'Toutes les thématiques du socle doivent être requises';

    ASSERT (
        SELECT bool_and(c.relrowsecurity)
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname IN ('demarche_pcaet_vulnerabilite_thematique',
                            'demarche_pcaet_vulnerabilite_valeur')
    ), 'RLS doit être activée sur les deux tables de la vulnérabilité';

    -- La table des thématiques mêle socle et données de collectivité : pas de
    -- lecture ouverte, tout passe par tRPC.
    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('demarche_pcaet_vulnerabilite_thematique',
                            'demarche_pcaet_vulnerabilite_valeur')
    ), 'Les tables de la vulnérabilité ne doivent avoir aucune policy (accès service_role uniquement)';
END $$;

ROLLBACK;
