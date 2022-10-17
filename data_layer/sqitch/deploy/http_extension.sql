-- Deploy tet:http_extension to pg

BEGIN;

create extension http with schema extensions;

COMMIT;
