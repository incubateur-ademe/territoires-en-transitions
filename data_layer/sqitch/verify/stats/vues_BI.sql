-- Verify tet:stats/vues_BI on pg

BEGIN;

select utilisateur, created_at
from stats.connection
where false;

select mois, connections, utilisateurs_uniques, total_connections, total_utilisateurs_uniques
from stats.evolution_connection
where false;

ROLLBACK;
