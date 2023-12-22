-- Revert tet:utils/audit from pg

BEGIN;

drop schema audit cascade;

COMMIT;
