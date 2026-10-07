-- Deploy tet:plan_action/analyse_volets_job_report to pg
-- requires: plan_action/analyse_volets_job

BEGIN;

ALTER TABLE public.analyse_volets_job RENAME COLUMN draft TO report;

COMMENT ON COLUMN public.analyse_volets_job.report IS
  'Compte rendu de la classification (ClassificationReport) : par fiche, la justification du modele et les volets retenus, fiches sans levier comprises. Ecrit dans la meme transaction que les volets, jamais soumis a validation ; NULL tant que le job n''est pas done.';

COMMIT;
