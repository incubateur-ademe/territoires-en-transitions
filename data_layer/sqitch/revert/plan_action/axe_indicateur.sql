-- Revert tet:plan_action/axe_indicateur from pg

BEGIN;

drop table public.axe_indicateur;

COMMIT;
