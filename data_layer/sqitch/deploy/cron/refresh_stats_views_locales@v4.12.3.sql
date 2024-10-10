-- Deploy tet:cron/refresh_stats_views_locales to pg

BEGIN;

select cron.unschedule('refresh_stats_views_locales');
select cron.schedule('refresh_stats_views_locales',
                     '0 2 * * *', -- tout les jours à 2h.
                     $$select stats.refresh_stats_locales();$$);

COMMIT;
