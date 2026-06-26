-- Verify tet:plan_action/plan_dates on pg

BEGIN;

select
  date_debut,
  date_fin
from public.axe
where false;

ROLLBACK;
