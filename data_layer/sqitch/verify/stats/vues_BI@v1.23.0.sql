-- Verify tet:stats/vues_BI on pg

BEGIN;

select mois, fiches
from stats.evolution_nombre_fiches
where false;

select mois, fiches
from stats_evolution_nombre_fiches
where false;

ROLLBACK;
