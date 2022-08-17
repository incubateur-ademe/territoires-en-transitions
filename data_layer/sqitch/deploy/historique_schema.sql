-- Deploy tet:history_schema to pg

BEGIN;

create schema historique;
grant usage on schema historique to postgres, anon, authenticated, service_role;
comment on schema historique is
    'Regroupe des fonctions liée à l''historique et les données historisées.';


COMMIT;
