-- Verify tet:plan_action/axe_description on pg

BEGIN;

select
  description
from public.axe
where true;

ROLLBACK;
