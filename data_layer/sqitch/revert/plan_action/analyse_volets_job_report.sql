-- Revert tet:plan_action/analyse_volets_job_report from pg

BEGIN;

ALTER TABLE public.analyse_volets_job RENAME COLUMN report TO draft;

COMMENT ON COLUMN public.analyse_volets_job.draft IS
  'Resultat propose (ClassificationDraft), fiches non classees comprises ; NULL tant que le job n''est pas done.';

COMMIT;
