-- Revert tet:cron/refresh_retool_stats_usages from pg

BEGIN;

select cron.unschedule('refresh_retool_stats_usages');

COMMIT;
