-- Deploy tet:plan_action/analyse_volets_job_derniere_analyse to pg
-- requires: plan_action/analyse_volets_job_report

BEGIN;

CREATE INDEX analyse_volets_job_derniere_analyse
    ON public.analyse_volets_job (collectivite_id, enjeu, created_at DESC, id DESC);

COMMENT ON INDEX public.analyse_volets_job_derniere_analyse IS
  'Sert la lecture de la derniere analyse d''une collectivite, interrogee en boucle pendant qu''un job tourne. L''index unique in-flight ne couvre que les jobs en vol, la cle primaire ne connait pas la collectivite.';

COMMIT;
