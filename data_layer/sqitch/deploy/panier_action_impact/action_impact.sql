-- Deploy tet:panier_action_impact/action_impact to pg

BEGIN;

create table panier_partenaire
(
    id serial primary key,
    nom text
);

create table action_impact_partenaire
(
    action_impact_id integer references action_impact,
    partenaire_id integer references panier_partenaire,
    primary key (action_impact_id, partenaire_id)
);

COMMIT;
