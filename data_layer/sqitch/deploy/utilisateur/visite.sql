-- Deploy tet:utilisateur/visite to pg

BEGIN;

create type visite_page as enum (
    'autre',
    -- auth
    'signin',
    'signup',
    'recover',
    'recover_landing',
    -- compte
    'mon_compte',
    'mes_collectivites',
    'rejoindre',
    -- pages
    'toutes_collectivites',
    'tableau_de_bord',
    'referentiel',
    'indicateur',
    'action',
    'labellisation',
    'personnalisation',
    'membre',
    'bibliotheque',
    'historique',
    'plan',
    'fiche'
    );
create type visite_tag as enum (
    'cae',
    'eci',
    'crte',
    'referentiel',
    'thematique',
    'personnalise'
    );
create type visite_onglet as enum (
    -- referentiel
    'progression',
    'priorisation',
    'detail',
    -- action
    'suivi',
    'preuve',
    'indicateur',
    'historique',
    -- labellisation
    'comparaison' ,
    'critere'
    );

create table visite
(
    time            timestamp with time zone default current_timestamp not null,
    page            visite_page                                        not null,
    tag             visite_tag,
    onglet          visite_onglet,
    user_id         uuid,
    collectivite_id integer
);
comment on table visite
    is 'Permet de suivre les visites des pages.';
alter table visite
    enable row level security;
create policy can_write on visite for insert with check (
        is_authenticated() and -- on enregistre l'usage des seuls utilisateurs
        (user_id = auth.uid() or user_id is null) -- on vérifie que l'id est celui de l'utilisateur ou qu'il est absent
    );

select create_hypertable('visite', 'time');
create index ix_page_time on visite (page, time desc);

COMMIT;
