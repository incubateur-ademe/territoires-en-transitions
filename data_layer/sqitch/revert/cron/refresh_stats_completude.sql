-- Revert tet:cron/refresh_stats_completude from pg

BEGIN;

select cron.unschedule('refresh_stats_completude');

COMMIT;
