-- Deploy tet:plan_action/drop_analyse_volets_job to pg
-- requires: plan_action/analyse_volets_job_derniere_analyse

BEGIN;

drop table public.analyse_volets_job;

COMMIT;
