-- Deploy tet:cron/refresh_stats_views_crm to pg

BEGIN;

select cron.schedule('refresh_stats_views_crm',
                     '0 3 * * *', -- tout les jours à 3h.
                     $$select stats.refresh_views_crm();$$);

COMMIT;
