-- Verify tet:plan_action/fiche_action_pilote_add_audit_columns on pg

BEGIN;

select
  created_at,
  created_by
from public.fiche_action_pilote
where true;

select 1 / count(*)
from pg_constraint
where conname = 'fiche_action_pilote_created_by_not_null';

ROLLBACK;
