-- Revert tet:stats/completude from pg

BEGIN;

drop materialized view stats_tranche_completude;

COMMIT;
