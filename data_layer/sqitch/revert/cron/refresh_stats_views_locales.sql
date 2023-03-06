-- Revert tet:cron/refresh_stats_views_locales from pg

BEGIN;

select cron.unschedule('refresh_stats_views_locales');

COMMIT;
