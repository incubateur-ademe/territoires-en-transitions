-- Verify tet:plan_action/axe_indicateur_add_audit_columns on pg

BEGIN;

select
  created_at,
  created_by,
  modified_at,
  modified_by
from public.axe_indicateur
where true;

ROLLBACK;
