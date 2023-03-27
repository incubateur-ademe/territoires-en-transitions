-- Revert tet:retool/usage from pg

BEGIN;

drop view retool_stats_usages;

COMMIT;
