-- Verify tet:demarche/plan_actions_multiples on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT COUNT(*) = 4
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_plan_action'
          AND column_name IN ('demarche_id', 'plan_action_id', 'created_at', 'created_by')
    ), 'La table demarche_plan_action doit contenir les 4 colonnes attendues';

    -- Plusieurs plans par démarche : l'unicité porte sur le couple, pas sur la
    -- démarche seule.
    ASSERT (
        SELECT indexdef LIKE '%(demarche_id, plan_action_id)'
        FROM pg_indexes
        WHERE schemaname = 'public' AND indexname = 'demarche_plan_action_pkey'
    ), 'La clé primaire doit porter sur (demarche_id, plan_action_id)';

    ASSERT (
        SELECT COUNT(*) = 0
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche'
          AND column_name = 'plan_action_id'
    ), 'La colonne demarche.plan_action_id doit avoir été retirée';

    -- Exclusivité plan ↔ démarche active : le trigger remplace l'index partiel,
    -- que le statut de la démarche mettait hors de portée.
    ASSERT (
        SELECT COUNT(*) = 1
        FROM pg_trigger
        WHERE tgrelid = 'public.demarche_plan_action'::regclass
          AND tgname = 'demarche_plan_action_exclusif'
          AND NOT tgisinternal
    ), 'Le trigger d''exclusivité doit exister sur demarche_plan_action';

    ASSERT (
        SELECT c.relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'demarche_plan_action'
    ), 'RLS doit être activée sur demarche_plan_action';
    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'demarche_plan_action'
    ), 'demarche_plan_action ne doit avoir aucune policy (accès service_role uniquement)';
END $$;

ROLLBACK;
