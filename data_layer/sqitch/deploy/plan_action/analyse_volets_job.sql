-- Deploy tet:plan_action/analyse_volets_job to pg
-- requires: plan_action/collectivite_volet_ges

BEGIN;

ALTER TABLE public.classification_volets_job RENAME TO analyse_volets_job;

ALTER TABLE public.analyse_volets_job
  RENAME CONSTRAINT classification_volets_job_pkey TO analyse_volets_job_pkey;
ALTER TABLE public.analyse_volets_job
  RENAME CONSTRAINT classification_volets_job_collectivite_id_fkey TO analyse_volets_job_collectivite_id_fkey;
ALTER TABLE public.analyse_volets_job
  RENAME CONSTRAINT classification_volets_job_created_by_fkey TO analyse_volets_job_created_by_fkey;
ALTER TABLE public.analyse_volets_job
  RENAME CONSTRAINT classification_volets_job_status_check TO analyse_volets_job_status_check;
ALTER TABLE public.analyse_volets_job
  RENAME CONSTRAINT classification_volets_job_etape_check TO analyse_volets_job_etape_check;
ALTER INDEX public.classification_volets_job_in_flight_unique
  RENAME TO analyse_volets_job_in_flight_unique;

COMMENT ON TABLE public.analyse_volets_job IS 'Job asynchrone d''analyse IA des fiches d''une collectivite par volet : classification puis mobilisation.';

COMMIT;
