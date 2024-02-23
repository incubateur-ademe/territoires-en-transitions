-- Deploy tet:panier_action_impact/action_impact to pg

BEGIN;

--- Contenus

create table categorie_fnv
(
    id  serial primary key,
    nom text not null
);
insert into categorie_fnv(id, nom)
values (1, 'Transversal'),
       (2, 'Mieux se déplacer'),
       (3, 'Mieux se loger'),
       (4, 'Mieux préserver les ressources'),
       (5, 'Mieux préserver la biodiversité'),
       (6, 'Mieux produire'),
       (7, 'Mieux se nourrir'),
       (8, 'Mieux consommer');

create table action_impact_complexite
(
    niveau integer primary key,
    nom    text not null
);
insert into action_impact_complexite(niveau, nom)
values (1, 'simple'),
       (2, 'intermédiaire'),
       (3, 'élevée');

create table action_impact_fourchette_budgetaire
(
    niveau integer primary key,
    nom    text not null
);
insert into action_impact_fourchette_budgetaire(niveau, nom)
values (1, 'De 0 à 40 000€'),
       (2, 'De 40 000€ à 100 000€'),
       (3, 'Plus de 100 000€');

create table action_impact_tier
(
    niveau integer primary key,
    nom    text not null
);
insert into action_impact_tier(niveau, nom)
values (1, '1'),
       (2, '2'),
       (3, '3');


-- Action à impact

create table action_impact
(
    id                       serial primary key,
    titre                    text    not null,
    description              text    not null,

    ressources_externes      text,
    nb_collectivite_en_cours integer not null                                                default 1,
    nb_collectivite_realise  integer not null                                                default 1,
    action_continue          boolean not null                                                default false,

    niveau_complexite        integer not null references action_impact_complexite            default 1,
    fourchette_budgetaire    integer not null references action_impact_fourchette_budgetaire default 1,
    impact_tier              integer not null references action_impact_tier                  default 1
);


--- Table de passage

create table action_impact_thematique
(
    action_impact_id integer references action_impact,
    thematique_id    integer references thematique,
    primary key (action_impact_id, thematique_id)
);

create table action_impact_sous_thematique
(
    action_impact_id   integer references action_impact,
    sous_thematique_id integer references sous_thematique,
    primary key (action_impact_id, sous_thematique_id)
);

create table action_impact_banatic_competence
(
    action_impact_id integer references action_impact,
    competence_code  integer references banatic_competence,
    primary key (action_impact_id, competence_code)
);

create table action_impact_categorie_fnv
(
    action_impact_id integer references action_impact,
    categorie_fnv_id integer references categorie_fnv,
    primary key (action_impact_id, categorie_fnv_id)
);

create table action_impact_action
(
    action_impact_id integer references action_impact,
    action_id        action_id references action_definition,
    primary key (action_impact_id, action_id)
);

create table action_impact_indicateur
(
    action_impact_id integer references action_impact,
    indicateur_id    indicateur_id references indicateur_definition,
    primary key (action_impact_id, indicateur_id)
);

COMMIT;
