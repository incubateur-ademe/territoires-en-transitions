-- Revert tet:labellisation/import from pg

BEGIN;

DROP TABLE IF EXISTS imports.labellisation;

COMMIT;
