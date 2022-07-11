-- Verify tet:cron/refresh_stats_collectivite on pg

BEGIN;

select 1/count(*) from cron.job where jobname = 'refresh_stats_collectivite';

ROLLBACK;
