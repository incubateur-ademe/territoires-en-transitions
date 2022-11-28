-- Deploy tet:stats/schema to pg

BEGIN;

create schema if not exists stats;
grant usage on schema stats to postgres, anon, authenticated, service_role;
comment on schema stats is
    'Regroupe des fonctions stats afin que le schema public ne comprenne que les éléments pour l''API.';

COMMIT;
