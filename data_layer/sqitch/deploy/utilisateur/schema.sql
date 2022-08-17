-- Deploy tet:utilisateur/schema to pg

BEGIN;

create schema utilisateur;
comment on schema utilisateur is
    'Regroupe les éléments hors API qui permettent de gérer les utilisateurs.';
grant usage on schema utilisateur to postgres, anon, authenticated, service_role;

COMMIT;
