-- Revert tet:stats/fonctionalite from pg

BEGIN;

drop view stats_functionnalities_usage_proportion;

COMMIT;
