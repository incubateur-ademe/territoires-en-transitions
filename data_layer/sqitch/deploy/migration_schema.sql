-- Deploy tet:migration_schema to pg

BEGIN;

create schema if not exists migration;

COMMIT;
