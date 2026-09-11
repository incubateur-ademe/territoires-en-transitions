-- Verify tet:plan_action/fiche_action_indicateur_add_audit_columns on pg

BEGIN;

select
  created_at,
  created_by,
  modified_at,
  modified_by
from public.fiche_action_indicateur
where true;

ROLLBACK;
