-- Revert tet:cron/refresh_stats_collectivite from pg

BEGIN;

select cron.unschedule('refresh_stats_collectivite');

COMMIT;
