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
    niveau serial primary key,
    nom    text not null
);
insert into action_impact_complexite(niveau, nom)
values (1, 'simple'),
       (2, 'intermédiaire'),
       (3, 'élevée');

create table action_impact_fourchette_budgetaire
(
    niveau serial primary key,
    nom    text not null
);
insert into action_impact_fourchette_budgetaire(niveau, nom)
values (1, 'De 0 à 40 000€'),
       (2, 'De 40 000€ à 100 000€'),
       (3, 'Plus de 100 000€'),
       (4, 'Non estimé');

create table action_impact_tier
(
    niveau serial primary key,
    nom    text not null
);
insert into action_impact_tier(niveau, nom)
values (1, '1'),
       (2, '2'),
       (3, '3');

create table action_impact_temps_de_mise_en_oeuvre
(
    niveau serial primary key,
    nom    text not null
);
insert into action_impact_temps_de_mise_en_oeuvre(niveau, nom)
values (1, 'Moins d’1 an'),
       (2, '1 a 2 ans'),
       (3, 'Plus de 2 ans'),
       (4, 'Non estimé');

create table effet_attendu
(
    id     serial primary key ,
    nom    text not null,
    notice text
);
insert into effet_attendu (id, nom, notice)
values (1, 'Adaptation au changement climatique', null),
       (2, 'Allongement de la durée d''usage', null),
       (3, 'Amélioration de la qualité de l''air', null),
       (4, 'Développement des énergies renouvelables', null),
       (5, 'Préservation de la biodiversité', null),
       (6, 'Réduction des consommations énergétiques', null),
       (7, 'Réduction des déchets', null),
       (8, 'Réduction des polluants atmosphériques', null),
       (9, 'Réduction des émissions de gaz à effet de serre', null),
       (10, 'Sobriété ', null),
       (11, 'Préservation des ressources agricoles, forestières et aquatiques', null),
       (12, 'Régénération des sols', null),
       (13, 'Sécurité alimentaire', null),
       (14, 'Stockage carbone', null),
       (15, 'Limitation de la sécheresse', null),
       (16, 'Prévention des inondations', null),
       (17, 'Accompagnement au changement de pratiques', null),
       (18, 'Création de lien social', null),
       (19, 'Réduction des surfaces imperméabilisées', null),
       (20, 'Réduction du taux de motorisation', null),
       (21, 'Bénéfique pour la santé', null),
       (22, 'Amélioration du cadre de vie', null),
       (23, 'Gains économiques', null),
       (24, 'Limitation des déplacements', null);


-- Action à impact

create table action_impact
(
    id                       serial primary key,

    titre                      text not null,
    description                text not null,
    description_complementaire text not null default '',

    nb_collectivite_en_cours integer not null                                                default 1,
    nb_collectivite_realise  integer not null                                                default 1,
    action_continue          boolean not null                                                default false,

    temps_de_mise_en_oeuvre  integer not null references action_impact_temps_de_mise_en_oeuvre  default 1,
    fourchette_budgetaire    integer not null references action_impact_fourchette_budgetaire default 1,
    impact_tier              integer not null references action_impact_tier                  default 1,

    subventions_mobilisables jsonb,
    ressources_externes      jsonb,
    rex                      jsonb,

    check (jsonb_matches_schema(
            schema :='{
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "label": {"type": "string"},
                  "url": {"type": "string"}
                },
                "required": ["label", "url"],
                "additionalProperties": false
              }
            }',
            instance := subventions_mobilisables
           )),
    check (jsonb_matches_schema(
            schema :='{
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "label": {"type": "string"},
                  "url": {"type": "string"}
                },
                "required": ["label", "url"],
                "additionalProperties": false
              }
            }',
            instance := ressources_externes
           )),
        check (jsonb_matches_schema(
        schema :='{
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "label": {"type": "string"},
                  "url": {"type": "string"}
                },
                "required": ["label", "url"],
                "additionalProperties": false
              }
            }',
        instance := rex
        ))
);
comment on column action_impact.subventions_mobilisables is 'Subventions mobilisables, liste de liens `[{label: string, url: string}]`';
comment on column action_impact.ressources_externes is 'Ressources externes, liste de liens `[{label: string, url: string}]`';
comment on column action_impact.rex is 'Retours sur experience, liste de liens `[{label: string, url: string}]`';
comment on column action_impact.description is 'La description courte affichée dans le panier.';
comment on column action_impact.description_complementaire is 'La description complémentaire ajoutée à la fiche action.';

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

create table action_impact_effet_attendu
(
    action_impact_id integer references action_impact,
    effet_attendu_id integer references effet_attendu,
    primary key (action_impact_id, effet_attendu_id)
);

COMMIT;
