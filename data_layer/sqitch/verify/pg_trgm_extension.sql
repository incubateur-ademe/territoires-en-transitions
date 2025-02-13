-- Verify tet:pg_trgm_extension on pg

BEGIN;

-- Verify the extension installation
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';

ROLLBACK;
