-- Revert tet:demarche/plan_action_exclusif from pg

BEGIN;

DROP INDEX IF EXISTS public.demarche_plan_action_active_unique;

COMMIT;
