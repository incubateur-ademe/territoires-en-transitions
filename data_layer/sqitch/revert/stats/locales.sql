-- Revert tet:stats/locale from pg

BEGIN;

drop view stats_evolution_total_activation_par_region;

COMMIT;
