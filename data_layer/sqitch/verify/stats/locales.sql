-- Verify tet:stats/locale on pg

BEGIN;

select mois, code_region, code_departement, total, total_epci, total_syndicat, total_commune
from stats_evolution_total_activation_locales
where false;

select typologie, code_region, code_departement, total, actives
from stats_collectivite_actives_locales_et_total_par_type
where false;

select mois, code_region, code_departement, moyen, maximum, median
from stats_evolution_locale_nombre_utilisateur_par_collectivite
where false;

select has_function_privilege('stats.refresh_stats_locales()', 'execute');

ROLLBACK;
