-- Deploy tet:typage_schema to pg

BEGIN;

create schema if not exists typage;

COMMIT;
