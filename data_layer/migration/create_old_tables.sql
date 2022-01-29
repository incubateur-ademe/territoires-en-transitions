create schema old; 
set search_path = old; 

create table if not exists actioncustom
(
    id          serial
        primary key,
    uid         varchar(36)                                        not null,
    epci_id     varchar(36)                                        not null,
    mesure_id   varchar(36)                                        not null,
    name        varchar(100)                                       not null,
    description text                                               not null,
    created_at  timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null
);

create table if not exists actionstatus
(
    id          serial
        primary key,
    action_id   varchar(36)                                        not null,
    epci_id     varchar(36)                                        not null,
    avancement  varchar(36)                                        not null,
    created_at  timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    latest      boolean                  default true              not null
);

create table if not exists indicateurvalue
(
    id            serial
        primary key,
    epci_id       varchar(36)                                        not null,
    indicateur_id varchar(36)                                        not null,
    value         varchar(36)                                        not null,
    year          integer                                            not null,
    created_at    timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at   timestamp with time zone default CURRENT_TIMESTAMP not null,
    latest        boolean                  default true              not null
);

create table if not exists mesurecustom
(
    id                        serial
        primary key,
    uid                       varchar(36)                                        not null,
    epci_id                   varchar(36)                                        not null,
    climat_pratic_thematic_id varchar(100)                                       not null,
    name                      varchar(100)                                       not null,
    created_at                timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at               timestamp with time zone default CURRENT_TIMESTAMP not null
);

create table if not exists ficheaction
(
    id                          serial
        primary key,
    epci_id                     varchar(36)                                            not null,
    uid                         varchar(36)                                            not null,
    custom_id                   varchar(36)                                            not null,
    avancement                  varchar(36)                                            not null,
    referentiel_action_ids      jsonb                                                  not null,
    titre                       varchar(300)                                           not null,
    description                 text                                                   not null,
    budget                      double precision                                       not null,
    personne_referente          varchar(100)                                           not null,
    commentaire                 text                                                   not null,
    date_debut                  varchar(36)                                            not null,
    date_fin                    varchar(36)                                            not null,
    created_at                  timestamp with time zone default CURRENT_TIMESTAMP     not null,
    modified_at                 timestamp with time zone default CURRENT_TIMESTAMP     not null,
    referentiel_indicateur_ids  jsonb                    default '[]'::jsonb           not null,
    indicateur_personnalise_ids jsonb                    default '[]'::jsonb           not null,
    partenaires                 varchar(300)             default ''::character varying not null,
    structure_pilote            varchar(300)             default ''::character varying not null,
    elu_referent                varchar(300)             default ''::character varying not null,
    latest                      boolean                  default true                  not null,
    deleted                     boolean                  default false                 not null,
    en_retard                   boolean                  default false                 not null
);

create table if not exists aerich
(
    id      serial
        primary key,
    version varchar(255) not null,
    app     varchar(20)  not null,
    content jsonb        not null
);

create table if not exists ficheactioncategorie
(
    id                 serial
        primary key,
    epci_id            varchar(36)                                        not null,
    uid                varchar(36)                                        not null,
    parent_uid         varchar(36)                                        not null,
    nom                varchar(300)                                       not null,
    fiche_actions_uids jsonb                                              not null,
    created_at         timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at        timestamp with time zone default CURRENT_TIMESTAMP not null,
    latest             boolean                  default true              not null,
    deleted            boolean                  default false             not null
);

create table if not exists indicateurpersonnalise
(
    id          serial
        primary key,
    epci_id     varchar(36)                                        not null,
    uid         varchar(36)                                        not null,
    custom_id   varchar(36)                                        not null,
    nom         varchar(300)                                       not null,
    description text                                               not null,
    unite       varchar(36)                                        not null,
    created_at  timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    latest      boolean                  default true              not null,
    deleted     boolean                  default false             not null,
    meta        jsonb                    default '{}'::jsonb       not null
);

create table if not exists indicateurpersonnalisevalue
(
    id            serial
        primary key,
    epci_id       varchar(36)                                        not null,
    indicateur_id varchar(136)                                       not null,
    value         varchar(36)                                        not null,
    year          integer                                            not null,
    created_at    timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at   timestamp with time zone default CURRENT_TIMESTAMP not null,
    latest        boolean                  default true              not null
);

create table if not exists indicateurreferentielcommentaire
(
    id            serial
        primary key,
    epci_id       varchar(36)                                        not null,
    indicateur_id varchar(136)                                       not null,
    value         text                                               not null,
    created_at    timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at   timestamp with time zone default CURRENT_TIMESTAMP not null,
    latest        boolean                  default true              not null
);

create table if not exists utilisateur
(
    id                    serial
        primary key,
    ademe_user_id         varchar(300)                                       not null,
    vie_privee_conditions varchar(300)                                       not null,
    created_at            timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at           timestamp with time zone default CURRENT_TIMESTAMP not null,
    latest                boolean                  default true              not null
);

create table if not exists utilisateurdroits
(
    id            serial
        primary key,
    ademe_user_id varchar(300)                                       not null,
    epci_id       varchar(36)                                        not null,
    ecriture      boolean                                            not null,
    created_at    timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at   timestamp with time zone default CURRENT_TIMESTAMP not null,
    latest        boolean                  default true              not null
);

create table if not exists epci
(
    id          serial
        primary key,
    uid         varchar(36)                                        not null,
    insee       varchar(5)                                         not null,
    siren       varchar(9)                                         not null,
    nom         varchar(300)                                       not null,
    created_at  timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    latest      boolean                  default true              not null
);

create table if not exists actionmeta
(
    id          serial
        primary key,
    action_id   varchar(36)                                        not null,
    epci_id     varchar(36)                                        not null,
    meta        jsonb                                              not null,
    created_at  timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    latest      boolean                                            not null
);

create table if not exists planaction
(
    id                 serial
        primary key,
    epci_id            varchar(36)                                        not null,
    uid                varchar(36)                                        not null,
    nom                varchar(300)                                       not null,
    categories         jsonb                                              not null,
    fiches_by_category jsonb                                              not null,
    created_at         timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at        timestamp with time zone default CURRENT_TIMESTAMP not null,
    latest             boolean                                            not null,
    deleted            boolean                                            not null
);

create table if not exists indicateurobjectif
(
    id            serial
        primary key,
    epci_id       varchar(36)                                        not null,
    indicateur_id varchar(36)                                        not null,
    value         double precision,
    year          integer                                            not null,
    created_at    timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at   timestamp with time zone default CURRENT_TIMESTAMP not null,
    latest        boolean                                            not null
);

create table if not exists indicateurpersonnaliseobjectif
(
    id            serial
        primary key,
    epci_id       varchar(36)                                        not null,
    indicateur_id varchar(36)                                        not null,
    value         double precision,
    year          integer                                            not null,
    created_at    timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at   timestamp with time zone default CURRENT_TIMESTAMP not null,
    latest        boolean                                            not null
);

create table if not exists indicateurpersonnaliseresultat
(
    id            serial
        primary key,
    epci_id       varchar(36)                                        not null,
    indicateur_id varchar(36)                                        not null,
    value         double precision,
    year          integer                                            not null,
    created_at    timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at   timestamp with time zone default CURRENT_TIMESTAMP not null,
    latest        boolean                                            not null
);

create table if not exists indicateurresultat
(
    id            serial
        primary key,
    epci_id       varchar(36)                                        not null,
    indicateur_id varchar(36)                                        not null,
    value         double precision,
    year          integer                                            not null,
    created_at    timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at   timestamp with time zone default CURRENT_TIMESTAMP not null,
    latest        boolean                                            not null
);

create table if not exists ademeutilisateur
(
    id            serial
        primary key,
    ademe_user_id varchar(300)                                       not null,
    email         varchar(300)                                       not null,
    nom           varchar(300)                                       not null,
    prenom        varchar(300)                                       not null,
    created_at    timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at   timestamp with time zone default CURRENT_TIMESTAMP not null
);
