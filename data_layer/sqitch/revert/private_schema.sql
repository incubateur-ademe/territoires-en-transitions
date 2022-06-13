-- Revert tet:private_schema from pg

BEGIN;

drop schema private;

COMMIT;
