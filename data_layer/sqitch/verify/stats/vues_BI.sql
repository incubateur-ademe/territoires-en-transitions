-- Verify tet:stats/vues_BI on pg

BEGIN;

select moyen, maximum, median
from stats.evolution_nombre_utilisateur_par_collectivite
where false;

ROLLBACK;
