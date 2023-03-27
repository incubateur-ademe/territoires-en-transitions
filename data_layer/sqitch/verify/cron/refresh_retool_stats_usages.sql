-- Verify tet:cron/refresh_retool_stats_usages on pg

BEGIN;

select 1/count(*) from cron.job where jobname = 'refresh_retool_stats_usages';

ROLLBACK;
