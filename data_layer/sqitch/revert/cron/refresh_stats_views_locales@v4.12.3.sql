-- Deploy tet:cron/refresh_stats_views_locales to pg

BEGIN;

select cron.schedule('refresh_stats_views_locales',
                     '0 2 * * *', -- tout les jours à 2h.
                     $$select stats.refresh_views_utilisation();$$);

COMMIT;
