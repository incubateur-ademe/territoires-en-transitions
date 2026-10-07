-- Deploy tet:evaluation/drop_business_evaluation to pg

BEGIN;

-- Pipeline d'appel au service « business » legacy, remplacé par le calcul des
-- scores du backend (score_snapshot). Les fonctions étaient déjà cassées (vues
-- service_regles, service_statuts, service_referentiel et late_collectivite
-- supprimées) : le trigger sur action_statut échouait silencieusement.
drop trigger after_action_statut_insert
  on public.action_statut;
drop function public.after_action_statut_call_business();

drop function evaluation.update_late_collectivite_scores(integer);
drop function evaluation.evaluate_regles(integer, varchar, varchar);
drop function evaluation.evaluate_statuts(integer, referentiel, varchar);
drop function evaluation.evaluation_payload(integer, referentiel);
drop function evaluation.current_service_configuration();
drop function evaluation.identite(integer);
drop function evaluation.convert_statut(action_id, avancement, double precision[], boolean);

drop view evaluation.service_reponses;
drop view evaluation.collectivite_latest_update;
drop type evaluation.update;
drop table evaluation.service_configuration;

-- Le schéma est désormais vide.
drop schema evaluation;

COMMIT;
