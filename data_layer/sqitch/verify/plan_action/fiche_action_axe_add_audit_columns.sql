-- Verify tet:plan_action/fiche_action_axe_add_audit_columns on pg

BEGIN;

select
  created_at,
  created_by
from public.fiche_action_axe
where true;

ROLLBACK;
