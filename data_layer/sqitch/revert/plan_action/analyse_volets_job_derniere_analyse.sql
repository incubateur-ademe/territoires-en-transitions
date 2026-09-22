-- Revert tet:plan_action/analyse_volets_job_derniere_analyse from pg

BEGIN;

DROP INDEX public.analyse_volets_job_derniere_analyse;

COMMIT;
