-- Revert tet:plan_action/analysis_run from pg

BEGIN;

DROP TABLE public.analysis_run;

COMMIT;
