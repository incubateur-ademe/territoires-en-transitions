-- Revert tet:retool/modification from pg

BEGIN;

drop view retool_last_activity;

COMMIT;
