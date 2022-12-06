-- Revert tet:cron/refresh_stats_views from pg

BEGIN;

select cron.unschedule('refresh_stats_views');

COMMIT;
