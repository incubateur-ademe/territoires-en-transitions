-- Verify tet:stats/utilisateur on pg

BEGIN;

select date, count, cumulated_count
from stats_unique_active_users
where false;

ROLLBACK;
