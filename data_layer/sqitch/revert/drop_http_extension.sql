-- Revert tet:drop_http_extension from pg

BEGIN;

create extension if not exists http with schema extensions;

COMMIT;
