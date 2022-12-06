-- Verify tet:cron/refresh_stats_views on pg

BEGIN;

select 1/count(*) from cron.job where jobname = 'refresh_stats_views';

ROLLBACK;
