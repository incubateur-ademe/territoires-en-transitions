-- Revert tet:stats/completude from pg

BEGIN;

drop view stats_tranche_completude;

COMMIT;
