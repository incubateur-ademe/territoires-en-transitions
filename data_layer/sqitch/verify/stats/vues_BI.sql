-- Verify tet:stats/vues_BI on pg

BEGIN;

select mois, collectivites
from stats.evolution_collectivite_avec_minimum_fiches
where false;

select mois, collectivites
from stats_evolution_collectivite_avec_minimum_fiches
where false;

select mois, fiches
from stats.evolution_nombre_fiches
where false;

select mois, fiches
from stats_evolution_nombre_fiches
where false;

ROLLBACK;
