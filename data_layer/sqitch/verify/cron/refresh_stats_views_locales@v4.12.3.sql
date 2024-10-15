-- Verify tet:cron/refresh_stats_views_locales on pg

BEGIN;

select 1/count(*) from cron.job where jobname = 'refresh_stats_views_locales';

ROLLBACK;
