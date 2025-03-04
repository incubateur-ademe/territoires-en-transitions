-- Revert tet:labellisation/labellisation from pg

BEGIN;

drop table labellisation;

COMMIT;
