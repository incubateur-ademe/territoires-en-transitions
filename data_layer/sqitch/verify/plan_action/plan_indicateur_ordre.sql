-- Verify tet:plan_action/plan_indicateur_ordre on pg

BEGIN;

select
  plan_id,
  indicateur_id,
  collectivite_id,
  ordre
from public.plan_indicateur_ordre
where true;

ROLLBACK;
