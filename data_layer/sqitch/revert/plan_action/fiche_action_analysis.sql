-- Revert tet:plan_action/fiche_action_analysis from pg

BEGIN;

DROP TABLE public.fiche_action_analysis;

COMMIT;
