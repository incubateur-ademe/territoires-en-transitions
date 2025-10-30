-- Verify tet:plan_action/soft_delete_fiche on pg

BEGIN;

select deleted from public.fiche_action limit 0;

ROLLBACK;
