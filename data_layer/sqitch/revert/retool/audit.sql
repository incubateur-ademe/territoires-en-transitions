-- Revert tet:retool/audit from pg

BEGIN;

drop view retool_audit;

COMMIT;
