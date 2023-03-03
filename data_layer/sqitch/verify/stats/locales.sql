-- Verify tet:stats/locale on pg

BEGIN;

select mois, total, total_epci, total_syndicat, total_commune, region_code
from stats_evolution_total_activation_par_region
where false;

ROLLBACK;
