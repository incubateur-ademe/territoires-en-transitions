-- Deploy tet:plan_action/classification_volets_par_collectivite to pg
-- requires: plan_action/classification_volets_enjeu

BEGIN;

DROP INDEX public.classification_volets_job_in_flight_unique;

ALTER TABLE public.classification_volets_job
    DROP COLUMN plan_id;

COMMENT ON TABLE public.classification_volets_job IS
  'Job asynchrone de classification IA des fiches d''une collectivite par volet.';

CREATE UNIQUE INDEX classification_volets_job_in_flight_unique
    ON public.classification_volets_job (collectivite_id, enjeu)
    WHERE status IN ('pending', 'running');

COMMIT;
