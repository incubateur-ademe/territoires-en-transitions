-- Verify tet:stats/locale on pg

BEGIN;

select mois, code_region, code_departement, collectivites
from stats.locales_evolution_collectivite_avec_minimum_fiches
where false;

select mois, code_region, code_departement, collectivites
from stats_locales_evolution_collectivite_avec_minimum_fiches
where false;

select mois, code_region, code_departement, fiches
from stats.locales_evolution_nombre_fiches
where false;

select mois, code_region, code_departement, fiches
from stats_locales_evolution_nombre_fiches
where false;

ROLLBACK;
