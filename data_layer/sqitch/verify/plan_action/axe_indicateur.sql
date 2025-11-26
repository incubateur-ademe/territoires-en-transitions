-- Verify tet:plan_action/axe_indicateur on pg

BEGIN;

select
  axe_id,
  indicateur_id
from public.axe_indicateur
where true;

ROLLBACK;
