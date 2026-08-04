-- Verify tet:demarche/demarche on pg

BEGIN;

DO $$
DECLARE
    status_check text;
BEGIN
    ASSERT (
        SELECT COUNT(*) = 17
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche'
          AND column_name IN ('id', 'collectivite_id', 'type', 'titre', 'description', 'status',
                              'publication_status', 'obligation', 'launched_at', 'published_at',
                              'transmitted_at', 'avis_deadline_at',
                              'plan_action_id', 'created_at', 'created_by', 'modified_at', 'modified_by')
    ), 'La table demarche doit contenir les 17 colonnes attendues';

    SELECT cc.check_clause INTO status_check
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = 'public' AND ccu.table_name = 'demarche'
      AND ccu.column_name = 'status'
    LIMIT 1;
    ASSERT status_check IS NOT NULL, 'La colonne status doit avoir une contrainte CHECK';
    ASSERT status_check LIKE '%''pcaet''%' AND status_check LIKE '%''transmis_pour_avis''%',
        'La contrainte CHECK de status doit être conditionnée par le type de démarche';

    ASSERT (
        SELECT COUNT(*) = 6
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_pilote'
    ), 'La table demarche_pilote doit contenir les 6 colonnes attendues';

    ASSERT (
        SELECT COUNT(*) = 7
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_status_history'
    ), 'La table demarche_status_history doit contenir les 7 colonnes attendues';

    ASSERT (
        SELECT bool_and(c.relrowsecurity)
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname IN ('demarche', 'demarche_pilote', 'demarche_status_history')
    ), 'RLS doit être activée sur les 3 tables demarche*';

    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('demarche', 'demarche_pilote', 'demarche_status_history')
    ), 'Les tables demarche* ne doivent avoir aucune policy (RLS deny-by-default, accès service_role uniquement)';
END $$;

ROLLBACK;
