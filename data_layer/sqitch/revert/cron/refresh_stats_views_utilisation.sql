-- Revert tet:cron/refresh_stats_views_utilisation from pg

BEGIN;

select cron.unschedule('refresh_stats_views_utilisation');

COMMIT;
