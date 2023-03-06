-- Revert tet:stats/locale from pg

BEGIN;

drop function stats.refresh_stats_locales;
drop materialized view stats_evolution_total_activation_locales;

COMMIT;
