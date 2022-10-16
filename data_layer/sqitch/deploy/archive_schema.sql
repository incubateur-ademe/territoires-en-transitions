-- Deploy tet:archive_schema to pg

BEGIN;

create schema archive;
grant usage on schema archive to postgres;
comment on schema archive is
    'Destiné à stocker les données dépréciées.';

COMMIT;
