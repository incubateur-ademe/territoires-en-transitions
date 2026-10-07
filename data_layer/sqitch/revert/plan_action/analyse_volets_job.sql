-- Revert tet:plan_action/analyse_volets_job from pg

BEGIN;

ALTER INDEX public.analyse_volets_job_in_flight_unique
  RENAME TO classification_volets_job_in_flight_unique;
ALTER TABLE public.analyse_volets_job
  RENAME CONSTRAINT analyse_volets_job_etape_check TO classification_volets_job_etape_check;
ALTER TABLE public.analyse_volets_job
  RENAME CONSTRAINT analyse_volets_job_status_check TO classification_volets_job_status_check;
ALTER TABLE public.analyse_volets_job
  RENAME CONSTRAINT analyse_volets_job_created_by_fkey TO classification_volets_job_created_by_fkey;
ALTER TABLE public.analyse_volets_job
  RENAME CONSTRAINT analyse_volets_job_collectivite_id_fkey TO classification_volets_job_collectivite_id_fkey;
ALTER TABLE public.analyse_volets_job
  RENAME CONSTRAINT analyse_volets_job_pkey TO classification_volets_job_pkey;

ALTER TABLE public.analyse_volets_job RENAME TO classification_volets_job;

COMMENT ON TABLE public.classification_volets_job IS 'Job asynchrone de classification IA des fiches d''une collectivite par volet.';

COMMIT;
