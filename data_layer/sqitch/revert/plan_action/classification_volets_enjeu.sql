-- Revert tet:plan_action/classification_volets_enjeu from pg

BEGIN;

DROP INDEX public.classification_volets_job_in_flight_unique;

CREATE UNIQUE INDEX classification_volets_job_in_flight_unique
    ON public.classification_volets_job (plan_id)
    WHERE status IN ('pending', 'running');

ALTER TABLE public.classification_volets_job DROP COLUMN enjeu;

DROP TYPE public.enjeu;

COMMIT;
