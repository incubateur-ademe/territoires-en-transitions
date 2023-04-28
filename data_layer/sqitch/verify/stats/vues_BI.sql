-- Verify tet:stats/vues_BI on pg

BEGIN;

select collectivite_id, cot, etoiles_eci, etoiles_cae
from stats.engagement_collectivite
where false;

ROLLBACK;
