-- Verify tet:plan_action/axe_indicateur_add_audit_columns on pg

BEGIN;

select
  created_at,
  created_by
from public.axe_indicateur
where true;

select 1 / count(*)
from pg_constraint
where conname = 'axe_indicateur_created_by_not_null';

ROLLBACK;
