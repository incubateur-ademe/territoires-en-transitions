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
          AND table_name = 'demarche_pcaet_vulnerabilite_domaine'
          AND column_name IN ('id', 'code', 'label', 'collectivite_id',
                              'requis', 'display_order')
    ), 'La table demarche_pcaet_vulnerabilite_domaine doit contenir les colonnes attendues';

    ASSERT (
        SELECT COUNT(*) = 7
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'demarche_pcaet_vulnerabilite_valeur'
          AND column_name IN ('demarche_id', 'domaine_id', 'niveau_maintenant',
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

    -- Un domaine ajouté n'a pas de code, un domaine du socle en a un.
    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.check_constraints
        WHERE constraint_schema = 'public'
          AND constraint_name = 'demarche_pcaet_vulnerabilite_domaine_code_socle_check'
    ), 'Le lien entre code et appartenance au socle doit être contraint';

    ASSERT (
        SELECT COUNT(*) = 2
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname IN ('demarche_pcaet_vulnerabilite_domaine_code_key',
                            'demarche_pcaet_vulnerabilite_domaine_collectivite_label_key')
    ), 'Les index d''unicité du socle et des domaines ajoutés doivent exister';

    -- Le socle est seedé par la migration : sans lui le tableau est vide.
    ASSERT (
        SELECT COUNT(*) = 16
        FROM public.demarche_pcaet_vulnerabilite_domaine
        WHERE collectivite_id IS NULL
    ), 'Les 16 domaines du socle doivent être seedés';

    ASSERT (
        SELECT bool_and(requis)
        FROM public.demarche_pcaet_vulnerabilite_domaine
        WHERE collectivite_id IS NULL
    ), 'Tous les domaines du socle doivent être requis';

    ASSERT (
        SELECT bool_and(c.relrowsecurity)
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname IN ('demarche_pcaet_vulnerabilite_domaine',
                            'demarche_pcaet_vulnerabilite_valeur')
    ), 'RLS doit être activée sur les deux tables de la vulnérabilité';

    -- La table des domaines mêle socle et données de collectivité : pas de
    -- lecture ouverte, tout passe par tRPC.
    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('demarche_pcaet_vulnerabilite_domaine',
                            'demarche_pcaet_vulnerabilite_valeur')
    ), 'Les tables de la vulnérabilité ne doivent avoir aucune policy (accès service_role uniquement)';
END $$;

ROLLBACK;
