-- Revert tet:stats/locale from pg

BEGIN;

drop function stats.refresh_stats_locales;
drop view stats_evolution_total_activation_locales;
drop materialized view stats.evolution_total_activation_locales;
drop view stats_collectivite_actives_locales_et_total_par_type;
drop materialized view stats.collectivite_actives_locales_et_total_par_type;

COMMIT;
