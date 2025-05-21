-- Revert tet:collation from pg

BEGIN;

DROP COLLATION IF EXISTS case_and_accent_insensitive_and_numeric;

COMMIT;
