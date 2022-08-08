-- Revert tet:history_schema from pg

BEGIN;

drop schema history;

COMMIT;
