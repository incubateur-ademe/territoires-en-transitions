-- Revert tet:cron/refresh_stats_views_crm from pg

BEGIN;

select cron.unschedule('refresh_stats_views_crm');

COMMIT;
