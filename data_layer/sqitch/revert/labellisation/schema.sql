-- Revert tet:labellisation/schema from pg

BEGIN;

drop schema labellisation;

COMMIT;
