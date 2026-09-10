-- Deploy tet:plan_action/classification_volets_enjeu to pg
-- requires: plan_action/classification_volets

BEGIN;

CREATE TYPE public.enjeu AS ENUM ('ges');

COMMENT ON TYPE public.enjeu IS
  'Enjeu environnemental classe par un job. La liste fait foi dans enjeuEnumValues (@tet/domain/shared). Il selectionne le prompt, le schema de reponse et la table de volets de destination.';

ALTER TABLE public.classification_volets_job
    ADD COLUMN enjeu public.enjeu NOT NULL DEFAULT 'ges';

ALTER TABLE public.classification_volets_job
    ALTER COLUMN enjeu DROP DEFAULT;

COMMENT ON COLUMN public.classification_volets_job.enjeu IS
  'Sans defaut : chaque enfilement nomme son enjeu. Le NOT NULL porte aussi l''unicite, un NULL n''entrant dans aucun conflit d''index.';

DROP INDEX public.classification_volets_job_in_flight_unique;

CREATE UNIQUE INDEX classification_volets_job_in_flight_unique
    ON public.classification_volets_job (plan_id, enjeu)
    WHERE status IN ('pending', 'running');

COMMIT;
