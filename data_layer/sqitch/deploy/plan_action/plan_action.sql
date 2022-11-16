-- Deploy tet:plan_action to pg

BEGIN;

drop trigger after_collectivite_insert on collectivite;
drop function after_collectivite_insert_default_plan();
drop table plan_action cascade;
drop trigger after_fiche_action_write on fiche_action;
drop function after_fiche_action_write_save_relationships();
drop function update_fiche_relationships(fiche_action_uid uuid, action_ids action_id[], indicateur_ids
    indicateur_id[], indicateur_personnalise_ids integer[]);
drop table fiche_action_indicateur_personnalise;
drop table fiche_action_indicateur;
drop table fiche_action_action;
drop table fiche_action cascade;
drop type fiche_action_avancement;

create type fiche_action_thematiques as enum(
    'Agriculture et alimentation',
    'Bâtiments',
    'Consommation responsable',
    'Déchets',
    'Développement économique',
    'Eau',
    'Forêts, biodiversité et espaces verts',
    'Formation, sensibilisation, communication',
    'Gestion, production et distribution de l’énergie',
    'Mobilité',
    'Organisation interne',
    'Partenariats et coopération',
    'Précarité énergétique',
    'Stratégie',
    'Tourisme',
    'Urbanisme et aménagement'
    );

create type fiche_action_piliers_eci as enum (
    'Approvisionnement durable',
    'Écoconception',
    'Écologie industrielle (et territoriale)',
    'Économie de la fonctionnalité',
    'Consommation responsable',
    'Allongement de la durée d’usage',
    'Recyclage'
    );

create type fiche_action_resultats_attendus as enum (
    'Adaptation au changement climatique',
    'Sensibilisation',
    'Réduction des polluants atmosphériques',
    'Réduction des émissions de gaz à effet de serre',
    'Sobriété énergétique',
    'Efficacité énergétique',
    'Développement des énergies renouvelables'
    );

create type fiche_action_cibles as enum(
    'Grand public et associations',
    'Autres collectivités du territoire',
    'Acteurs économiques'
    );

create type fiche_action_statuts as enum(
    'À venir',
    'En cours',
    'Réalisé',
    'En pause',
    'Abandonné'
    );

create type fiche_action_niveaux_priorite as enum(
    'Élevé',
    'Moyen',
    'Bas'
    );

-- Table fiche_action
create table fiche_action
(
    id                      serial primary key,
    titre                   varchar(300),
    description             varchar(20000),
    thematiques             fiche_action_thematiques[],
    piliers_eci             fiche_action_piliers_eci[],
    objectifs               varchar(10000),
    resultats_attendus      fiche_action_resultats_attendus[],
    cibles                  fiche_action_cibles[],
    ressources              varchar(10000),-- Moyens humains et techniques
    financements            text,
    budget_previsionnel     integer,-- TODO Budget prévisionnel (20 digits max+espaces)
    statut                  fiche_action_statuts,
    niveau_priorite         fiche_action_niveaux_priorite,
    date_debut              timestamp with time zone,
    date_fin_provisoire     timestamp with time zone,
    amelioration_continue   boolean,-- Action en amélioration continue, sans date de fin
    calendrier              varchar(10000),
    notes_complementaires   varchar(20000),
    maj_termine             boolean,-- Mise à jour de la fiche terminée
    collectivite_id         integer references collectivite not null
);

-- Table plan_action
create table plan_action(
                            id serial primary key,
                            nom text,
                            parent integer references fiche_action
);
create table fiche_action_plan_action(
                                         fiche_id integer references fiche_action not null,
                                         plan_id integer references plan_action not null,
                                         primary key (fiche_id, plan_id)
);

-- Structure table de tags
create table tags(
                     nom text not null,
                     collectivite_id integer references collectivite not null,
                     unique(nom, collectivite_id)
);
-- Partenaires (Tags)
create table partenaires_tags(
                                 id serial primary key,
                                 like tags including all
);
create table fiche_action_partenaires_tags(
                                              fiche_id integer references fiche_action not null,
                                              partenaires_tags_id integer references partenaires_tags not null,
                                              primary key (fiche_id, partenaires_tags_id)
);
-- Structure pilote (Tags)
create table structures_tags(
                                id serial primary key,
                                like tags including all
);
create table fiche_action_structures_tags(
                                             fiche_id integer references fiche_action not null,
                                             structures_tags_id integer references structures_tags not null,
                                             primary key (fiche_id, structures_tags_id)
);

-- Utilisateurs non enregistrés
create table users_tags(
                           id serial primary key,
                           like tags including all
);
-- Personne pilote (lien auth.users + tags)
create table fiche_action_pilotes(
                                     fiche_id integer references fiche_action not null,
                                     utilisateur uuid references auth.users,
                                     tag integer references users_tags,
                                     primary key(fiche_id, utilisateur, tag)
);
-- Elu.e référent.e (lien auth.users + tags)
create table fiche_action_referents(
                                       fiche_id integer references fiche_action not null,
                                       utilisateur uuid references auth.users,
                                       tag integer references users_tags,
                                       primary key(fiche_id, utilisateur, tag)
);
-- TODO Indicateurs liés
-- Actions liées
create table fiche_action_action(
                                    fiche_id integer references fiche_action not null,
                                    action_id action_id references action_relation not null,
                                    primary key (fiche_id, action_id)
);
-- Documents et liens (voir preuve)
create table annexes(
                        id        serial primary key,
                        like labellisation.preuve_base including all
);
create table fiche_action_annexes(
                                     fiche_id integer references fiche_action not null,
                                     annexe_id integer references annexes not null,
                                     primary key (fiche_id, annexe_id)
);

-- TODO Fiches liées (champs calculé)

-- TODO droits

COMMIT;