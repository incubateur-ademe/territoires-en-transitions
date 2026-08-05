-- Revert tet:collectivite/dreal_unique_region_code from pg

BEGIN;

DROP INDEX IF EXISTS collectivite_dreal_unique_region_code;

COMMIT;
