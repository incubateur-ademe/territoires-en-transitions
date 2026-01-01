-- Revert tet:plan_action/add_fiche_recursive_axe_view from pg

BEGIN;

DROP view if exists public.fiche_recursive_axe;

COMMIT;
