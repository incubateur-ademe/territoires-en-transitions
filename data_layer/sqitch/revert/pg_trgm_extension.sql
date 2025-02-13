-- Revert tet:pg_trgm_extension from pg

BEGIN;

DROP EXTENSION IF EXISTS pg_trgm;

COMMIT;
