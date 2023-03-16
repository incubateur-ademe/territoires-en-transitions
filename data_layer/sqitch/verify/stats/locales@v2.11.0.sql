-- Verify tet:stats/locale on pg

BEGIN;

select mois, code_region, code_departement, utilisateurs, total_utilisateurs
from stats_locales_evolution_utilisateur
where false;

select mois, code_region, code_departement, moyen, maximum, median
from stats_locales_evolution_nombre_utilisateur_par_collectivite
where false;

select has_function_privilege('stats.refresh_stats_locales()', 'execute');

ROLLBACK;
