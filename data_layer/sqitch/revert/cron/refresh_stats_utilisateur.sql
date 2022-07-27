-- Revert tet:cron/refresh_stats_utilisateur from pg

BEGIN;

select cron.unschedule('refresh_stats_utilisateur');

COMMIT;
