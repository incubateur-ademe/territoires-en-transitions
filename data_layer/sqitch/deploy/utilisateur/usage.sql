-- Deploy tet:utilisateur/usage to pg

BEGIN;

-- on utilise des enums pour utiliser 63 octets max par colonne.
create type usage_fonction as enum (
    'aide',
    'preuve',
    'graphique',
    'decrocher_les_etoiles',
    'rejoindre_une_collectivite',
    'collectivite_carte',
    'pagination',
    'filtre',
    'recherche',
    'filtre_region',
    'filtre_departement',
    'filtre_type',
    'filtre_population',
    'filtre_referentiel',
    'filtre_niveau',
    'filtre_remplissage'
    );
create type usage_action as enum (
    'clic',
    'vue',
    'telechargement',
    'saisie',
    'selection'
    );

create table usage
(
    time            timestamp with time zone default current_timestamp not null,
    fonction        usage_fonction                                     not null,
    action          usage_action                                       not null,
    page            visite_page,
    user_id         uuid,
    collectivite_id integer
);
comment on table usage
    is 'Permet de suivre les usages des fonctionnalités.';
alter table usage
    enable row level security;
create policy can_write on usage for insert with check (
        is_authenticated() and -- on enregistre l'usage des seuls utilisateurs
        (user_id = auth.uid() or user_id is null) -- on vérifie que l'id est celui de l'utilisateur ou qu'il est absent
    );

select create_hypertable('usage', 'time');
create index ix_fonction_time on usage (fonction, time desc);

COMMIT;
