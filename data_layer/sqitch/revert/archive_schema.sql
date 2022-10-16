-- Revert tet:archive_schema from pg

BEGIN;

drop schema archive;

COMMIT;
