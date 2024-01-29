-- Deploy tet:panier_action_impact/action_impact to pg

BEGIN;

--- Contenus

create table categorie_fnv
(
    id  serial primary key,
    nom text not null
);
insert into categorie_fnv(id, nom)
values (0, 'Transversal'),
       (1, 'Mieux se déplacer'),
       (2, 'Mieux se loger'),
       (3, 'Mieux préserver les ressources'),
       (4, 'Mieux préserver la biodiversité'),
       (5, 'Mieux produire'),
       (6, 'Mieux se nourrir'),
       (7, 'Mieux consommer');

create table action_impact_complexite
(
    niveau integer primary key,
    nom    text not null
);
insert into action_impact_complexite(niveau, nom)
values (0, 'simple'),
       (1, 'intermédiaire'),
       (2, 'élevée');

create table action_impact_fourchette_budgetaire
(
    niveau integer primary key,
    nom    text not null
);
insert into action_impact_fourchette_budgetaire(niveau, nom)
values (0, '1'),
       (1, '2'),
       (2, '3');

create table action_impact_tier
(
    niveau integer primary key,
    nom    text not null
);
insert into action_impact_tier(niveau, nom)
values (0, '1'),
       (1, '2'),
       (2, '3');


-- Action à impact

create table action_impact
(
    id                       serial primary key,
    titre                    text    not null,
    description              text    not null,

    ressources_externes      jsonb   not null                                                default '{}'::jsonb,
    nb_collectivite_en_cours integer not null                                                default 0,
    nb_collectivite_realise  integer not null                                                default 0,
    action_continue          boolean not null                                                default false,

    niveau_complexite        integer not null references action_impact_complexite            default 0,
    fourchette_budgetaire    integer not null references action_impact_fourchette_budgetaire default 0,
    impact_tier              integer not null references action_impact_tier                  default 0
);


--- Table de passage

create table action_impact_thematique
(
    action_impact integer references action_impact,
    thematique    integer references thematique,
    primary key (action_impact, thematique)
);

create table action_impact_sous_thematique
(
    action_impact   integer references action_impact,
    sous_thematique integer references sous_thematique,
    primary key (action_impact, sous_thematique)
);

create table action_impact_banatic_competence
(
    action_impact      integer references action_impact,
    banatic_competence integer references banatic_competence,
    primary key (action_impact, banatic_competence)
);

create table action_impact_categorie_fnv
(
    action_impact integer references action_impact,
    categorie_fnv integer references categorie_fnv,
    primary key (action_impact, categorie_fnv)
);

create table action_impact_action
(
    action_impact integer references action_impact,
    action_id     action_id references action_definition,
    primary key (action_impact, action_id)
);

create table action_impact_indicateur
(
    action_impact integer references action_impact,
    indicateur_id indicateur_id references indicateur_definition,
    primary key (action_impact, indicateur_id)
);

COMMIT;
