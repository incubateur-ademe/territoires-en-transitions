-- Deploy tet:automatisation_schema to pg

BEGIN;

create schema if not exists automatisation;

COMMIT;
