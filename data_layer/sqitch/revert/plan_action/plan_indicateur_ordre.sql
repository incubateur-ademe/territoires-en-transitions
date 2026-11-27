-- Revert tet:plan_action/plan_indicateur_ordre from pg

BEGIN;

drop table public.plan_indicateur_ordre;

COMMIT;
