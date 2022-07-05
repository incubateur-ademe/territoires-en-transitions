-- Verify tet:stats/completude on pg

BEGIN;

select bucket, eci, cae
from stats_tranche_completude where false;

ROLLBACK;
