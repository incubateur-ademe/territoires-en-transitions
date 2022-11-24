-- Revert tet:migration_schema from pg

BEGIN;

drop schema migration;

COMMIT;
