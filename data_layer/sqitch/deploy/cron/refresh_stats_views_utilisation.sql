-- Deploy tet:cron/refresh_stats_views_utilisation to pg

BEGIN;

select cron.schedule('refresh_stats_views_utilisation',
                     '0 1 * * *', -- tout les jours à 1h.
                     $$select stats.refresh_views_utilisation();$$);

COMMIT;
