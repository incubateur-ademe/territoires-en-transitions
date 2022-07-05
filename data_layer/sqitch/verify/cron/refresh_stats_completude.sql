-- Verify tet:cron/refresh_stats_completude on pg

BEGIN;

select 1/count(*) from cron.job where jobname = 'refresh_stats_completude';

ROLLBACK;
