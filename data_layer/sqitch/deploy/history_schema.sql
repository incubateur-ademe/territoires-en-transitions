-- Deploy tet:history_schema to pg

BEGIN;

create schema history;
grant usage on schema history to postgres, anon, authenticated, service_role;
comment on schema history is
    'Regroupe des fonctions liée à l''historique et les données historisées.';


COMMIT;
