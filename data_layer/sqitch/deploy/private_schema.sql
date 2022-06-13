-- Deploy tet:private_schema to pg

BEGIN;

create schema if not exists private;
grant usage on schema private to postgres, anon, authenticated, service_role;
comment on schema private is
    'Regroupe des fonctions privées afin que le schema public ne comprenne que les éléments pour l''API.';

COMMIT;
