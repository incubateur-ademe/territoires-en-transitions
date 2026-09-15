-- Revert tet:plan_action/collectivite_volet_ges from pg

BEGIN;

DROP TABLE public.collectivite_volet_ges;

ALTER TABLE public.classification_volets_job
    DROP CONSTRAINT classification_volets_job_etape_check;

ALTER TABLE public.classification_volets_job
    DROP COLUMN etape;

COMMIT;
