-- Revert tet:referentiel/vues from pg

BEGIN;

drop function action_perimetre_evaluation(id action_id);
drop function action_reduction_potentiel(id action_id);
drop function action_ressources(id action_id);
drop function action_preuve(id action_id);
drop function action_contexte(id action_id);
drop function action_exemples(id action_id);
drop function action_down_to_tache(referentiel referentiel, identifiant text);
drop function referentiel_down_to_action(referentiel referentiel);
drop view action_title;
drop view action_definition_summary;
drop view action_children;
drop view business_action_children;

COMMIT;
