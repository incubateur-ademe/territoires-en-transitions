-- Verify tet:stats/vues_BI on pg

BEGIN;

select mois,
       etoile_1,
       etoile_2,
       etoile_3,
       etoile_4,
       etoile_5
from stats.evolution_nombre_labellisations
where false;

select mois,
       etoile_1,
       etoile_2,
       etoile_3,
       etoile_4,
       etoile_5
from stats_evolution_nombre_labellisations

where false;

ROLLBACK;
