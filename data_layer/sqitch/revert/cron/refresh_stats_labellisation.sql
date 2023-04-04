-- Revert tet:cron/refresh_stats_labellisation from pg

BEGIN;

select cron.unschedule('refresh_stats_derniere_labellisation');

COMMIT;
