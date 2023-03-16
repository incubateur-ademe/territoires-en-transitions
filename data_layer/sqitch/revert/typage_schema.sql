-- Revert tet:typage_schema from pg

BEGIN;

drop schema typage;

COMMIT;
