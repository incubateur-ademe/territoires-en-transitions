-- Deploy tet:pg_trgm_extension to pg

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMIT;
