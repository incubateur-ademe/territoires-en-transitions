-- Deploy tet:labellisation/schema to pg

BEGIN;

create schema labellisation;
comment on schema labellisation is
    'Regroupe les éléments hors API qui permettent de déterminer la possibilité d''accéder à une demande d''audit.';
grant usage on schema labellisation to postgres, anon, authenticated, service_role;

COMMIT;
