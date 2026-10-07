-- Revert tet:plan_action/classification_volets from pg

BEGIN;

ALTER INDEX classification_volets_job_in_flight_unique
  RENAME TO classification_leviers_job_in_flight_unique;
ALTER TABLE classification_volets_job
  RENAME CONSTRAINT classification_volets_job_status_check TO classification_leviers_job_status_check;
ALTER TABLE classification_volets_job
  RENAME CONSTRAINT classification_volets_job_created_by_fkey TO classification_leviers_job_created_by_fkey;
ALTER TABLE classification_volets_job
  RENAME CONSTRAINT classification_volets_job_plan_id_fkey TO classification_leviers_job_plan_id_fkey;
ALTER TABLE classification_volets_job
  RENAME CONSTRAINT classification_volets_job_collectivite_id_fkey TO classification_leviers_job_collectivite_id_fkey;
ALTER TABLE classification_volets_job
  RENAME CONSTRAINT classification_volets_job_pkey TO classification_leviers_job_pkey;
ALTER TABLE classification_volets_job RENAME TO classification_leviers_job;

ALTER TABLE fiche_action_volet_ges
  RENAME CONSTRAINT fiche_action_volet_ges_created_by_fkey TO fiche_action_levier_created_by_fkey;
ALTER TABLE fiche_action_volet_ges
  RENAME CONSTRAINT fiche_action_volet_ges_fiche_id_fkey TO fiche_action_levier_fiche_id_fkey;
ALTER TABLE fiche_action_volet_ges
  RENAME CONSTRAINT fiche_action_volet_ges_pkey TO fiche_action_levier_pkey;
ALTER TABLE fiche_action_volet_ges RENAME TO fiche_action_levier;

ALTER TYPE volet_categorie RENAME TO levier_categorie;
ALTER TYPE levier_ges_id RENAME TO levier_id;

comment on type levier_id is
  'Identifiants techniques des leviers de decarbonation. La liste fait foi dans levierIdEnumValues (@tet/domain/shared) : ce type en est le reflet, verifie par un test.';

comment on type levier_categorie is
  'Categories de type d''action rattachables a un levier. La liste fait foi dans categorieActionEnumValues (@tet/domain/shared). A ne pas confondre avec action_categorie, qui porte la taxonomie du referentiel.';

comment on table fiche_action_levier is
  'Rattachement durable d''une fiche action a un couple levier de decarbonation x categorie de type d''action';

COMMENT ON TABLE public.classification_leviers_job IS 'Job asynchrone de classification IA des fiches d''un plan par levier de decarbonation.';
COMMENT ON COLUMN public.classification_leviers_job.plan_id IS 'Axe racine du plan classe ; un sous-axe est refuse a l''enfilement.';
COMMENT ON COLUMN public.classification_leviers_job.created_by IS 'Utilisateur ayant lance la classification.';
COMMENT ON COLUMN public.classification_leviers_job.status IS 'pending | running | done | failed.';
COMMENT ON COLUMN public.classification_leviers_job.processed_batches IS 'Nombre de lots termines, reussis ou non ; sert la progression.';
COMMENT ON COLUMN public.classification_leviers_job.total_batches IS 'Nombre de lots a traiter, connu une fois les fiches lues.';
COMMENT ON COLUMN public.classification_leviers_job.draft IS 'Resultat propose (ClassificationDraft), fiches non classees comprises ; NULL tant que le job n''est pas done.';
COMMENT ON COLUMN public.classification_leviers_job.token_usage IS 'Jetons consommes, cumules sur tous les lots.';
COMMENT ON COLUMN public.classification_leviers_job.error IS 'Renseigne quand status = failed.';

COMMIT;
