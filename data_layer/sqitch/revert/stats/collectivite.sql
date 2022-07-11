-- Revert tet:stats/collectivite from pg

BEGIN;

drop view stats_unique_active_collectivite;
drop view stats_rattachements;
drop view stats_real_collectivites;

COMMIT;
