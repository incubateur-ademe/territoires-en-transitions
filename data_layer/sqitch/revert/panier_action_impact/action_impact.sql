-- Revert tet:panier_action_impact/action_impact from pg

BEGIN;

drop table action_impact_indicateur;
drop table action_impact_action;
drop table action_impact_categorie_fnv;
drop table action_impact_banatic_competence;
drop table action_impact_sous_thematique;
drop table action_impact_thematique;
drop table action_impact;
drop table action_impact_tier;
drop table action_impact_fourchette_budgetaire;
drop table action_impact_complexite;
drop table action_impact_temps_mise_en_oeuvre;
drop table categorie_fnv;

COMMIT;
