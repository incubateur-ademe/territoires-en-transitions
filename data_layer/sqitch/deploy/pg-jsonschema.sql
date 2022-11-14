-- Deploy tet:pg-jsonschema to pg

BEGIN;

create extension if not exists pg_jsonschema;

COMMIT;
