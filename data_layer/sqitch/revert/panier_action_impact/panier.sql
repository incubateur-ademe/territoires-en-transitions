-- Revert tet:panier_action_impact/panier from pg

BEGIN;

drop function action_impact_state(panier);
drop function thematique(action_impact_state);
drop function action_impact_fourchette_budgetaire(action_impact_state);
drop function action_impact_temps_de_mise_en_oeuvre(action_impact_state);
drop function matches_competences(action_impact_state);
drop function action_impact_matches_competences(integer, integer);
drop table action_impact_state;

drop table action_impact_statut;
drop table action_impact_categorie;
drop table action_impact_panier;

drop function panier_from_landing(integer);
drop function panier_of_collectivite(integer);
drop function panier_from_landing();
alter publication supabase_realtime drop table panier;
drop table panier;

drop function panier_change_latest_update;
drop function panier_set_latest_update;

COMMIT;
