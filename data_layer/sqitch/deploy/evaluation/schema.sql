-- Deploy tet:evaluation/schema to pg

BEGIN;

create schema if not exists evaluation;
grant usage on schema evaluation to postgres, anon, authenticated, service_role;
comment on schema evaluation is
    'Regroupe des fonctions privées afin que le schema public ne comprenne que les éléments pour l''API.';


COMMIT;
