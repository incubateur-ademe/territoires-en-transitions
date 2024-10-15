-- Deploy tet:cron/refresh_stats_views_locales to pg

BEGIN;

select cron.unschedule('refresh_stats_views_locales_indicateur');

COMMIT;
