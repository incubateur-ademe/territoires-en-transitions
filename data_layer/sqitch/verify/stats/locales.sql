-- Verify tet:stats/locale on pg

BEGIN;

select mois, code_region, code_departement, total, total_epci, total_syndicat, total_commune
from stats_locales_evolution_total_activation
where false;

select typologie, code_region, code_departement, total, actives
from stats_locales_collectivite_actives_et_total_par_type
where false;

select mois, code_region, code_departement, moyen, maximum, median
from stats_locales_evolution_nombre_utilisateur_par_collectivite
where false;

select mois, code_region, code_departement, fiches
from stats_locales_evolution_nombre_fiches
where false;

select has_function_privilege('stats.refresh_stats_locales()', 'execute');

ROLLBACK;
