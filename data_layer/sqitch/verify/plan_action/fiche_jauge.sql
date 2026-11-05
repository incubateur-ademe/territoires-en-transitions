-- Verify tet:plan_action/fiche_jauge on pg

BEGIN;

select jauge from public.fiche_action where false;
select jauge, previous_jauge from historique.fiche_action where false;

DO $$
BEGIN
    ASSERT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.fiche_action'::regclass
          AND conname = 'fiche_action_jauge_check'
          AND contype = 'c'
          AND convalidated
    ), 'La contrainte de la jauge doit exister et être validée';
    ASSERT EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'historique'
          AND p.proname = 'save_fiche_action'
          AND pg_get_functiondef(p.oid) LIKE '%previous_jauge%'
    ), 'historique.save_fiche_action() doit historiser la jauge';
END $$;

ROLLBACK;
