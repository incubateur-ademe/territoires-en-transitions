-- Revert tet:plan_action/classification_volets_par_collectivite from pg

BEGIN;

DROP INDEX public.classification_volets_job_in_flight_unique;

ALTER TABLE public.classification_volets_job
    ADD COLUMN plan_id integer NOT NULL REFERENCES public.axe (id) ON DELETE CASCADE;

COMMENT ON COLUMN public.classification_volets_job.plan_id IS
  'Axe racine du plan classe ; un sous-axe est refuse a l''enfilement.';

COMMENT ON TABLE public.classification_volets_job IS
  'Job asynchrone de classification IA des fiches d''un plan par volet.';

CREATE UNIQUE INDEX classification_volets_job_in_flight_unique
    ON public.classification_volets_job (plan_id, enjeu)
    WHERE status IN ('pending', 'running');

COMMIT;
