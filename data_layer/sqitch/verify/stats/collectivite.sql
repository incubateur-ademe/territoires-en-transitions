-- Verify tet:stats/collectivite on pg

BEGIN;

select collectivite_id, nom
from stats_real_collectivites
where false;

select date, count, cumulated_count
from stats_rattachements
where false;

select date, count, cumulated_count
from stats_unique_active_collectivite
where false;

ROLLBACK;
