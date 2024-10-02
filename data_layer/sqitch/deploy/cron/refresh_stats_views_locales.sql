-- Deploy tet:cron/refresh_stats_views_locales to pg

BEGIN;

select cron.schedule('refresh_stats_views_locales_indicateur',
                     '15 2 * * *', -- tout les jours à 2h15.
                     $$select stats.refresh_stats_locales_indicateurs();$$);

COMMIT;
