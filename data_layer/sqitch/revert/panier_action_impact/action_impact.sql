-- Deploy tet:panier_action_impact/action_impact to pg

BEGIN;

drop table action_impact_partenaire;
drop table panier_partenaire;

drop policy allow_read on action_impact_fiche_action;

COMMIT;
